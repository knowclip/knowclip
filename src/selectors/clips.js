// @flow

import { basename, extname } from 'path'
import { toTimestamp } from '../utils/ffmpeg'
import { getMillisecondsAtX } from './waveformTime'
// import { getAudioFilePath } from './audio'

const SAFE_SEPARATOR = '-'
const SAFE_MILLISECONDS_SEPARATOR = '_'

export const getClipMilliseconds = (
  state: AppState,
  id: ClipId
): { start: number, end: number } => {
  const clip = state.clips.byId[id]
  if (!clip) throw new Error('Maybe impossible')
  return {
    start: getMillisecondsAtX(state, clip.start),
    end: getMillisecondsAtX(state, clip.end),
  }
}

// export const getClipAudioFilePath = (state: AppState, clipId: ClipId): ?AudioFilePath =>

export const getClipOutputParameters = (state: AppState, clipId: ClipId) => {
  const clip = state.clips.byId[clipId]
  if (!clip) throw Error(`Could not find clip ${clipId}`)
  const { start, end, fileId } = clip
  // const filePath = getAudioFilePath(state, fileId)
  const filePath = 'getAudioFilePath(state, fileId)'
  if (!filePath) throw Error(`Could not find file path for clip ${clipId}`)

  const extension = extname(filePath)
  const filenameWithoutExtension = basename(filePath, extension)
  const startTime = getMillisecondsAtX(state, start)
  const endTime = getMillisecondsAtX(state, end)

  const outputFilename = `${filenameWithoutExtension}___${toTimestamp(
    startTime,
    SAFE_SEPARATOR
  )}-${toTimestamp(
    endTime,
    SAFE_SEPARATOR,
    SAFE_MILLISECONDS_SEPARATOR
  )}___afcaId${clipId}${'.mp3'}`

  return {
    filePath,
    start: startTime,
    end: endTime,
    outputFilename,
  }
}

export const getClipFilename = (state: AppState, clipId: ClipId) =>
  getClipOutputParameters(state, clipId).outputFilename

export const getClipIdsByAudioFileId = (
  state: AppState,
  audioFileId: string
): Array<ClipId> => state.clips.idsByAudioFileId[audioFileId]

export const haveClipsBeenMade = (state: AppState): boolean =>
  Object.keys(state.clips.byId).length > 0

export const getDefaultTags = (state: AppState): Array<string> =>
  state.user.defaultTags
