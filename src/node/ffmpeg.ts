import { basename } from 'path'

import ffmpegImported, { FfprobeData } from 'fluent-ffmpeg'
import { failure } from '../utils/result'

export const ffmpeg =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('fluent-ffmpeg/lib/fluent-ffmpeg') as typeof ffmpegImported

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
  if (metadata.error) return { error: metadata.error }

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

export function writeMediaSubtitlesToVtt(
  mediaFilePath: string,
  streamIndex: number,
  outputFilePath: string
): Promise<string | null> {
  return new Promise((res, rej) =>
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
}

export const convertAssToVtt = (filePath: string, vttFilePath: string) =>
  new Promise((res, rej) =>
    ffmpeg(filePath)
      .output(vttFilePath)
      .on('end', () => {
        res(vttFilePath)
      })
      .on('error', (err) => {
        console.error(err)
        rej(err)
      })
      .run()
  )

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
