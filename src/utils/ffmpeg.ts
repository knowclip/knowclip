import { basename } from 'path'

import ffmpegImported, { FfprobeData } from 'fluent-ffmpeg'
import uuid from 'uuid/v4'

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

export const getMediaMetadata = (path: string): Promise<FfprobeData> => {
  return new Promise((res, rej) => {
    ffmpeg.ffprobe(path, (err, metadata) => {
      if (err) rej(err)

      res(metadata)
    })
  })
}

type Mxx = {
  id: FileId

  name: MediaFileName
  durationSeconds: number
  format: 'UNKNOWN' | string
  isVideo: boolean
  subtitlesTracksStreamIndexes: number[]
}

export const convertMediaMetadata = (
  ffprobeMetadata: FfprobeData,
  filePath: string,
  id: string
  // REMOVE THIS TYPE Mxx!!!!
): Mxx => ({
  id,
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
})

export const readMediaFileRecord = async (
  filePath: string,
  id: string,
  projectId: string,
  subtitles: Array<string> | null,
  flashcardFieldsToSubtitlesTracks: SubtitlesFlashcardFieldsLinks | null
): Promise<MediaFileRecord> => {
  const ffprobeMetadata = await getMediaMetadata(filePath)
  const metadata = convertMediaMetadata(ffprobeMetadata, filePath, id)

  return {
    id: metadata.id,
    type: 'MediaFile',
    parentId: projectId,
    subtitles: subtitles || [],
    flashcardFieldsToSubtitlesTracks: flashcardFieldsToSubtitlesTracks || {},

    name: metadata.name,
    durationSeconds: metadata.durationSeconds,
    format: metadata.format,
    isVideo: metadata.isVideo,
    subtitlesTracksStreamIndexes: metadata.subtitlesTracksStreamIndexes,
  }
}
