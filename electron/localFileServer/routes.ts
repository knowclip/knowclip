import fs from 'fs'
import Router from '@koa/router'
import {
  getMediaCompatibilityIssues,
  MediaCompatibilityIssue,
} from '../../src/node/getMediaCompatibilityIssues'
import { getMediaMetadata } from '../../src/node/ffmpeg'
import {
  MediaConversionType,
  convertMedia,
  getConversionTypeCode,
} from './convertMedia'
import Koa from 'koa'

const segmentDurationSeconds = 10

export function makeGetConvertedFileSegment(
  filePathsRegistry: Record<string, string>,
  conversionType: MediaConversionType,
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

    const ffmpegStreamResult = await convertMedia(
      videoPath,
      segmentDurationSeconds,
      segmentNumber,
      conversionType
    )

    if (ffmpegStreamResult.error) {
      console.error('Error converting media:', ffmpegStreamResult.error)
      ctx.status = 500
      return
    }

    ffmpegStreamResult.value
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
    ctx.body = ffmpegStreamResult.value.pipe(undefined, {
      end: true,
    })
  }
}

export function makeGetConvertedFilePlaylist(
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

    const { error, value: ffprobeMetadata } = await getMediaMetadata(videoPath)
    if (error || !ffprobeMetadata.format?.duration) {
      console.error('Error getting media metadata:', error || 'No duration')
      ctx.status = 500
      return
    }

    const { issues: compatibilityIssues } =
      getMediaCompatibilityIssues(ffprobeMetadata)

    const m3u8Text = getM3u8Text(
      fileId,
      segmentDurationSeconds,
      ffprobeMetadata.format.duration,
      compatibilityIssues
    )

    ctx.body = m3u8Text
  }
}

export function makeGetFile(
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

export function makePostFile(
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

export function getM3u8Text(
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
