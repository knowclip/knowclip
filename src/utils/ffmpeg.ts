import { basename } from 'path'

import ffmpegImported, { FfprobeData } from 'fluent-ffmpeg'

const ffmpeg = require('fluent-ffmpeg/lib/fluent-ffmpeg') as typeof ffmpegImported

const setFfmpegAndFfprobePath = () => {
  if (process.env.JEST_WORKER_ID) return

  // have to do it this way cause of webpack
  const ffmpegPath = require('electron').remote.getGlobal('ffmpegpath')
  ffmpeg.setFfmpegPath(ffmpegPath)
  const ffprobePath = require('electron').remote.getGlobal('ffprobepath')
  ffmpeg.setFfprobePath(ffprobePath)
}
setFfmpegAndFfprobePath()

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

export class AsyncError extends Error {
  thrown: any
  constructor(thrown: any, message = '') {
    const thrownMessage = thrown && 'message' in thrown ? thrown.message : null
    super([message, thrownMessage].filter(x => x).join(''))
    this.thrown = thrown
  }
}

export const getMediaMetadata = async (
  path: string
): Promise<FfprobeData | AsyncError> => {
  try {
    return await new Promise((res, rej) => {
      ffmpeg.ffprobe(path, (error, metadata) => {
        if (error) rej(error)

        res(metadata)
      })
    })
  } catch (error) {
    return new AsyncError(error)
  }
}

export const readMediaFile = async (
  filePath: string,
  id: string,
  projectId: string,
  subtitles: MediaFile['subtitles'] = [],
  flashcardFieldsToSubtitlesTracks: SubtitlesFlashcardFieldsLinks = {}
): Promise<MediaFile | AsyncError> => {
  const ffprobeMetadata = await getMediaMetadata(filePath)
  if (ffprobeMetadata instanceof AsyncError) return ffprobeMetadata

  return {
    id,
    type: 'MediaFile',
    parentId: projectId,
    subtitles,
    flashcardFieldsToSubtitlesTracks,

    name: basename(filePath),
    durationSeconds: ffprobeMetadata.format.duration || 0,
    format: ffprobeMetadata.format.format_name || 'UNKNOWN_FORMAT',
    isVideo:
      ffprobeMetadata.format.format_name !== 'mp3' &&
      ffprobeMetadata.streams.some(
        ({ codec_type }) => codec_type && /video/i.test(codec_type)
      ),
    subtitlesTracksStreamIndexes: ffprobeMetadata.streams
      .filter(stream => stream.codec_type === 'subtitle')
      .map(stream => stream.index),
  }
}
