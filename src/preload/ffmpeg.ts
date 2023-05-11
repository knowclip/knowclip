import { basename } from './path'

import ffmpegImported, { FfprobeData } from 'fluent-ffmpeg'
import { sendToMainProcess } from '../messages'

const ffmpeg =
  require('fluent-ffmpeg/lib/fluent-ffmpeg') as typeof ffmpegImported

if (!process.env.VITEST_WORKER_ID)
  sendToMainProcess({
    type: 'getFfmpegAndFfprobePath',
    args: [],
  }).then((getPaths) => {
    if (getPaths.error) {
      console.error(getPaths.error)
      throw new Error('Problem finding ffmpeg and ffprobe paths.')
    }
    ffmpeg.setFfmpegPath(getPaths.result.ffmpegpath)
    ffmpeg.setFfprobePath(getPaths.result.ffprobepath)
  })

export default ffmpeg

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
    return { errors: [String(error)] }
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
  if (metadata.errors) return { errors: metadata.errors }

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
