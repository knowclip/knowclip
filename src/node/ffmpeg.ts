import { basename } from 'path'

import ffmpeg, { FfprobeData } from 'fluent-ffmpeg'
import { failure } from '../utils/result'

const ffmpegStaticBasePathViaRequire = require('ffmpeg-static')
const ffprobeStaticBasePathViaRequire = require('ffprobe-static').path

const ffmpegStaticBasePath = ffmpegStaticBasePathViaRequire
const ffprobeStaticBasePath = ffprobeStaticBasePathViaRequire

const getFfmpegStaticPath = (basePath: string) =>
  basePath.replace('app.asar', 'app.asar.unpacked') // won't do anything in development

console.log({
  ffmpegStaticBasePath,
  ffprobeStaticBasePath,
  ffmpegStaticBasePathViaRequire,
  ffprobeStaticBasePathViaRequire,
})

if (!ffmpegStaticBasePath) throw new Error('ffmpeg-static path not found')
if (!ffprobeStaticBasePath) throw new Error('ffprobe-static path not found')
const ffmpegPaths = {
  ffmpeg: getFfmpegStaticPath(ffmpegStaticBasePath),
  ffprobe: getFfmpegStaticPath(ffprobeStaticBasePath),
}
try {
  ffmpeg.setFfmpegPath(ffmpegPaths.ffmpeg)
  ffmpeg.setFfprobePath(ffmpegPaths.ffprobe)
} catch (error) {
  console.error('Error setting ffmpeg paths:', error)
  throw error
}

export { ffmpeg }

const zeroPad = (zeroes: number, value: any) =>
  String(value).padStart(zeroes, '0')

export const toTimestamp = (
  milliseconds: number,
  unitsSeparator = ':',
  millisecondsSeparator = '.'
) => {
  const millisecondsStamp = zeroPad(3, Math.round(milliseconds % 1000))
  const secondsStamp = zeroPad(2, Math.floor(milliseconds / 1000) % 60)
  const minutesStamp = zeroPad(2, Math.floor(milliseconds / 1000 / 60) % 60)
  const hoursStamp = zeroPad(2, Math.floor(milliseconds / 1000 / 60 / 60))
  return `${hoursStamp}${unitsSeparator}${minutesStamp}${unitsSeparator}${secondsStamp}${millisecondsSeparator}${millisecondsStamp}`
}

export const getMediaMetadata = async (
  path: string
): AsyncResult<FfprobeData> => {
  try {
    return await new Promise((res, rej) => {
      ffmpeg.ffprobe(path, (error, ffprobeMetadata) => {
        if (error) rej(error)

        res({ value: ffprobeMetadata })
      })
    })
  } catch (error) {
    return failure(error)
  }
}

export const readMediaFile = async (
  filePath: string,
  id: string,
  projectId: string,
  subtitles: MediaFile['subtitles'] = [],
  flashcardFieldsToSubtitlesTracks: SubtitlesFlashcardFieldsLinks = {}
): AsyncResult<MediaFile> => {
  const metadata = await getMediaMetadata(filePath)
  if (metadata.error) return metadata

  const { value: ffprobeMetadata } = metadata
  const videoStream = ffprobeMetadata.streams.find(
    ({ codec_type }) => codec_type && /video/i.test(codec_type)
  )

  const base: MediaFile = {
    id,
    type: 'MediaFile',
    parentId: projectId,
    subtitles,
    flashcardFieldsToSubtitlesTracks,
    isVideo: false,

    name: basename(filePath),
    durationSeconds: +(ffprobeMetadata.format.duration || 0).toFixed(3),
    format: ffprobeMetadata.format.format_name || 'UNKNOWN_FORMAT',

    subtitlesTracksStreamIndexes: ffprobeMetadata.streams
      .filter((stream) => stream.codec_type === 'subtitle')
      .map((stream) => stream.index),
  }

  const file: MediaFile =
    ffprobeMetadata.format.format_name !== 'mp3' && videoStream
      ? {
          ...base,
          isVideo: true,

          width: videoStream.width as number,
          height: videoStream.height as number,
        }
      : {
          ...base,
          isVideo: false,
        }

  return { value: file }
}

export async function writeMediaSubtitlesToVtt(
  mediaFilePath: string,
  streamIndex: number,
  outputFilePath: string
): AsyncResult<string> {
  try {
    const vttFilepath: string = await new Promise((res, rej) =>
      ffmpeg(mediaFilePath)
        .outputOptions(`-map 0:${streamIndex}`)
        .output(outputFilePath)
        .on('end', () => {
          res(outputFilePath)
        })
        .on('error', (err) => {
          console.error(
            `Problem writing subtitles at stream index ${streamIndex} to VTT:`,
            err
          )
          rej(err)
        })
        .run()
    )
    return { value: vttFilepath }
  } catch (error) {
    return failure(error)
  }
}

export const convertAssToVtt = async (
  filePath: string,
  vttFilePath: string
): AsyncResult<'ok'> => {
  try {
    const result: 'ok' = await new Promise((res, rej) =>
      ffmpeg(filePath)
        .output(vttFilePath)
        .on('end', () => {
          res('ok')
        })
        .on('error', (err) => {
          console.error('Error converting ASS to VTT:', err)
          rej(err)
        })
        .run()
    )
    return { value: result }
  } catch (error) {
    return failure(error)
  }
}

export function createConstantBitrateMp3(
  inputPath: string,
  res: (value: string | PromiseLike<string>) => void,
  constantBitratePath: string,
  rej: (reason?: any) => void
) {
  return ffmpeg(inputPath)
    .audioBitrate('64k')
    .on('end', () => res(constantBitratePath))
    .on('error', rej)
    .output(constantBitratePath)
    .run()
}
