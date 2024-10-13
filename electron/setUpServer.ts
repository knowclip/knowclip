import net from 'net'
import http from 'http'
import fs from 'fs'
import os from 'os'
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { ffmpeg } from '../src/node/ffmpeg'
import {
  getMediaCompatibilityIssues,
  MediaCompatibilityIssue,
} from '../src/node/getMediaCompatibilityIssues'

const segmentDurationSeconds = 10

export async function setUpServer() {
  const filePathsRegistry: Record<string, string> = {}

  const server = new Koa()
  const router = new Router()

  router.get('/status', (ctx) => {
    ctx.body = 'ok'
    ctx.status = 200
  })

  router.post('/file/:id', makePostFile(filePathsRegistry))
  router.get('/file/:id', makeGetFile(filePathsRegistry))

  router.get(
    '/file/:id/converted/index.m3u8',
    makeGetConvertedFilePlaylist(filePathsRegistry)
  )
  router.get(
    '/file/:id/converted/v/:segmentNumber.ts',
    makeGetConvertedFileSegment(filePathsRegistry, 'transcode video')
  )
  router.get(
    '/file/:id/converted/va/:segmentNumber.ts',
    makeGetConvertedFileSegment(filePathsRegistry, 'transcode video and audio')
  )
  router.get(
    '/file/:id/converted/a/:segmentNumber.ts',
    makeGetConvertedFileSegment(filePathsRegistry, 'transcode video')
  )
  router.get(
    '/file/:id/converted/x/:segmentNumber.ts',
    makeGetConvertedFileSegment(filePathsRegistry, 'remux')
  )

  server.on('error', (error, ctx) => {
    if (
      (error.code === 'EPIPE' || error.code === 'ECONNRESET') &&
      ctx.request.url.startsWith('/file/')
    ) {
      // connection closed by client
    } else {
      console.error('Koa app-level error', { error })
    }
  })
  server.use(bodyParser())
  server.use(router.routes())
  server.use(router.allowedMethods())

  const port = await findFreePort(3000)
  const knowclipServerAddress = `http://${getLocalIpAddress()}:${port}`

  server.listen(port, () => {
    console.log(`Serving at ${knowclipServerAddress}`)
  })

  const status = await statusCheck(`${knowclipServerAddress}/status`)
  if (status === 200) {
    console.log('Server is up')
  } else {
    console.error('Server is down', status)
  }

  return { knowclipServerAddress, filePathsRegistry }
}

async function statusCheck(url: string) {
  return new Promise<number | undefined>((resolve, reject) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode)
    })
    req.on('error', reject)
  })
}

function makeGetConvertedFileSegment(
  filePathsRegistry: Record<string, string>,
  conversionType: ConversionType,
  verbose: boolean = false
): Router.Middleware<Koa.DefaultState, Koa.DefaultContext, unknown> {
  return async (ctx) => {
    console.log(`GET /file/:id/converted/:segmentNumber.ts`, ctx.params.id)
    const segmentNumber = parseInt(ctx.params.segmentNumber)
    if (isNaN(segmentNumber)) {
      ctx.status = 400
      return
    }

    const fileId = ctx.params.id
    const videoPath = filePathsRegistry[fileId]
    if (!videoPath) {
      console.warn('File not found for conversion:', fileId)
      ctx.status = 404
      return
    }

    const ffmpegStream = await convertMedia(
      videoPath,
      segmentDurationSeconds,
      segmentNumber,
      conversionType
    )

    ffmpegStream
      // in case we go with complex process management,
      // this will be where we track conversion progress.
      // but for now, we are starting a new process for each segment
      // .on("progress", (progress) => {
      //   const seconds = this.addSeekTimeToSeconds(
      //     this.timestampToSeconds(progress.timemark)
      //   );
      //   const latestSegment = Math.max(
      //     Math.floor(seconds / segmentDurationSeconds) - 1
      //   ); // - 1 because the first segment is 0
      //   console.log(
      //     "Transcoding progress:",
      //     progress.percent,
      //     "%",
      //     "Segment:",
      //     latestSegment
      //   );
      // })
      .on('end', () => {
        if (verbose) console.log('segment conversion finished', segmentNumber)
      })
      .on('start', (commandLine) => {
        if (verbose) console.log('Spawned FFMPEG with command: ' + commandLine)
      })
      .on('error', (err, stdout, stderr) => {
        if (
          err.message != 'Output stream closed' &&
          err.message != 'ffmpeg was killed with signal SIGKILL'
        ) {
          console.error('An error occurred while converting:', err.message)
          console.error('stdout:', stdout)
          console.error('stderr:', stderr)
        }
      })
      .on('stderr', (stderrLine) => {
        console.error('stderr:', stderrLine)
      })

    ctx.status = 200
    ctx.body = ffmpegStream.pipe(undefined, {
      end: true,
    })
  }
}

function makeGetConvertedFilePlaylist(
  filePathsRegistry: Record<string, string>
): Router.Middleware<Koa.DefaultState, Koa.DefaultContext, unknown> {
  return async (ctx) => {
    console.log(`GET /file/:id/converted/index.m3u8`, ctx.params.id)
    const fileId = ctx.params.id
    const videoPath = filePathsRegistry[fileId]
    if (!videoPath) {
      ctx.status = 404
      return
    }

    const ffprobeMetadata = await getFfprobeMetadata(videoPath)
    const videoDuration = ffprobeMetadata?.format?.duration
    if (typeof videoDuration !== 'number') {
      ctx.status = 500
      return
    }
    const { issues: compatibilityIssues } =
      getMediaCompatibilityIssues(ffprobeMetadata)

    const m3u8Text = getM3u8Text(
      fileId,
      segmentDurationSeconds,
      videoDuration,
      compatibilityIssues
    )

    ctx.body = m3u8Text
  }
}

function makeGetFile(
  filePathsRegistry: Record<string, string>
): Router.Middleware<Koa.DefaultState, Koa.DefaultContext, unknown> {
  return async (ctx) => {
    console.log(
      `GET /file/:id`,
      ctx.params.id,
      filePathsRegistry[ctx.params.id]
    )
    const fileId = ctx.params.id
    const filePath = filePathsRegistry[fileId]
    if (!filePath) {
      ctx.status = 404
      return
    }

    try {
      const rangeString = ctx.request.headers.range
      const range = rangeString?.match(/bytes=(\d+)-(\d+)?/)

      if (range) {
        const fileSize = fs.statSync(filePath).size
        const start = parseInt(range[1])
        const end = range[2] ? parseInt(range[2]) : fileSize - 1
        if (start >= fileSize) {
          ctx.status = 416 // Requested Range Not Satisfiable
          ctx.set('Content-Range', `bytes */${fileSize}`)
          return
        }
        const fileStream = fs.createReadStream(filePath, {
          start,
          end,
        })
        ctx.body = fileStream

        ctx.status = 206
        ctx.set('Content-Range', `bytes ${start}-${end}/${fileSize}`)
        ctx.set('Accept-Ranges', 'bytes')
        ctx.set('Content-Length', String(end - start + 1))
        ctx.type = 'video/mp4'
      } else {
        ctx.body = await fs.promises.readFile(filePath)
      }
    } catch (e) {
      console.error(e)
      ctx.status = 500
    }
  }
}

function makePostFile(
  filePathsRegistry: Record<string, string>
): Router.Middleware<Koa.DefaultState, Koa.DefaultContext, unknown> {
  return async (ctx) => {
    console.log(
      `POST /file/:id`,
      ctx.params.id,
      filePathsRegistry[ctx.params.id]
    )
    const fileId = ctx.params.id
    const body = JSON.parse(ctx.request.body as string) as {
      filePath: string
    }

    filePathsRegistry[fileId] = body.filePath
  }
}

// TODO: test that it finds a free port even when 3000 is taken
function findFreePort(startPort: number) {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(startPort, () => {
      const address = server.address()
      if (address && typeof address !== 'string') {
        const port = address.port
        server.close(() => resolve(port))
      } else {
        reject(new Error('Failed to find a free port'))
      }
    })
  })
}

function getLocalIpAddress() {
  const ifaces = os.networkInterfaces()
  const localIpAddresses = Object.keys(ifaces)
    .map((ifname) => ifaces[ifname])
    .flat()
    .filter((iface) => iface?.family === 'IPv4' && !iface.internal)
    .map((iface) => iface!.address)

  return localIpAddresses[0]
}

function getConversionTypeCode(
  compatibilityIssues: Set<MediaCompatibilityIssue>
) {
  if (
    compatibilityIssues.has(MediaCompatibilityIssue.INCOMPATIBLE_AUDIO_CODEC) &&
    compatibilityIssues.has(MediaCompatibilityIssue.INCOMPATIBLE_VIDEO_CODEC)
  ) {
    return 'va'
  } else if (
    compatibilityIssues.has(MediaCompatibilityIssue.INCOMPATIBLE_AUDIO_CODEC)
  ) {
    return 'a'
  } else if (
    compatibilityIssues.has(MediaCompatibilityIssue.INCOMPATIBLE_VIDEO_CODEC)
  ) {
    return 'v'
  } else {
    return 'x'
  }
}

function getM3u8Text(
  mediaFileId: string,
  segmentDurationSeconds: number,
  videoDuration: number,
  compatibilityIssues: Set<MediaCompatibilityIssue>
) {
  const conversionTypeCode = getConversionTypeCode(compatibilityIssues)

  const segmentCount = Math.ceil(videoDuration / segmentDurationSeconds)
  const padStartLength = segmentCount.toString().length
  const segmentsFilenames = Array.from({ length: segmentCount }, (_, i) => {
    const number = i.toString().padStart(padStartLength, '0')
    return `/file/${mediaFileId}/converted/${conversionTypeCode}/${number}.ts`
  })
  return [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    `#EXT-X-TARGETDURATION:${segmentDurationSeconds}`,
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXT-X-PLAYLIST-TYPE:VOD',
    ...segmentsFilenames.map(
      (filename) => `#EXTINF:${segmentDurationSeconds},\n${filename}`
    ),
    '#EXT-X-ENDLIST',
  ].join('\n')
}

async function getFfprobeMetadata(videoPath: string) {
  return new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err)
      }
      resolve(metadata)
    })
  })
}

async function convertVideo(
  filePath: string,
  segmentDurationSeconds: number,
  segmentNumber: number,
  conversionType: ConversionType
) {
  const segmentStartSeconds = segmentNumber * segmentDurationSeconds

  return ffmpeg(filePath)
    .withVideoCodec(
      conversionType === 'transcode video' ||
        conversionType === 'transcode video and audio'
        ? 'libx264'
        : 'copy'
    )
    .withAudioCodec(
      conversionType === 'transcode audio' ||
        conversionType === 'transcode video and audio'
        ? 'aac'
        : 'copy'
    )
    .inputOptions([
      '-copyts', // Fixes timestamp issues (Keep timestamps as original file)
      '-threads 8',
      `-ss ${segmentStartSeconds}`,
      '-t ' + segmentDurationSeconds,
    ])
    .outputOptions([
      '-copyts', // Fixes timestamp issues (Keep timestamps as original file)
      '-pix_fmt yuv420p',
      '-map 0',
      '-map -v',
      '-map 0:V',
      '-map 0:s?',
      '-g 52',
      // `-crf ${this.CRF_SETTING}`,
      '-sn',
      '-deadline realtime',
      '-preset:v ultrafast',
      '-f hls',
      `-hls_time ${segmentDurationSeconds}`,
      '-force_key_frames expr:gte(t,n_forced*2)',
      '-hls_playlist_type vod',
      `-start_number ${segmentNumber}`,
      '-strict -2',
      '-level 4.1', // Fixes chromecast issues
      '-ac 2', // Set two audio channels. Fixes audio issues for chromecast
      // '-b:v 1024k',
      '-b:a 192k',
      '-loglevel error',
    ])
}

type ConversionType =
  | 'transcode video'
  | 'transcode audio'
  | 'transcode video and audio'
  | 'remux'

async function convertMedia(
  filePath: string,
  segmentDurationSeconds: number,
  segmentNumber: number,
  conversionType: ConversionType
) {
  const ffprobeMetadata = await getFfprobeMetadata(filePath)

  const isVideo = ffprobeMetadata.streams.some(
    (stream) => stream.codec_type === 'video'
  )

  return isVideo
    ? convertVideo(
        filePath,
        segmentDurationSeconds,
        segmentNumber,
        conversionType
      )
    : convertAudio(
        filePath,
        segmentDurationSeconds,
        segmentNumber,
        conversionType
      )
}

async function convertAudio(
  audioPath: string,
  segmentDurationSeconds: number,
  segmentNumber: number,
  conversionType: ConversionType
) {
  const segmentStartSeconds = segmentNumber * segmentDurationSeconds
  return ffmpeg(audioPath)
    .withAudioCodec(conversionType === 'remux' ? 'copy' : 'aac')
    .inputOptions([
      '-copyts', // Fixes timestamp issues (Keep timestamps as original file)
      '-threads 8',
      `-ss ${segmentStartSeconds}`,
      '-t ' + segmentDurationSeconds,
    ])
    .outputOptions([
      '-copyts', // Fixes timestamp issues (Keep timestamps as original file)
      '-pix_fmt yuv420p',
      '-map 0',
      '-map -v',
      // '-map 0:V',
      '-map 0:s?',
      '-g 52',
      // `-crf ${this.CRF_SETTING}`,
      '-sn',
      '-deadline realtime',
      '-preset:v ultrafast',
      '-f hls',
      `-hls_time ${segmentDurationSeconds}`,
      '-force_key_frames expr:gte(t,n_forced*2)',
      '-hls_playlist_type vod',
      `-start_number ${segmentNumber}`,
      '-strict -2',
      '-level 4.1', // Fixes chromecast issues
      '-ac 2', // Set two audio channels. Fixes audio issues for chromecast
      // '-b:v 1024k',
      '-b:a 192k',
      '-loglevel error',
    ])
}
