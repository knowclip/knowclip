// @flow

import { basename, extname } from 'path'
import { toTimestamp } from '../utils/ffmpeg'
import { getMillisecondsAtX } from './waveformTime'

const SAFE_SEPARATOR = '-'

export const getClipMilliseconds = (state: AppState, id: ClipId): Object => {
  const clip = state.clips[id]
  if (!clip) throw new Error('Maybe impossible')
  return {
    start: getMillisecondsAtX(state, clip.start),
    end: getMillisecondsAtX(state, clip.end),
  }
}

export const getClipOutputParameters = (state: AppState, clipId: ClipId) => {
  const { start, end, filePath } = state.clips[clipId]
  const extension = extname(filePath)
  const filenameWithoutExtension = basename(filePath, extension)
  const startTime = getMillisecondsAtX(state, start)
  const endTime = getMillisecondsAtX(state, end)

  const outputFilename = `${filenameWithoutExtension}__${toTimestamp(
    startTime,
    SAFE_SEPARATOR
  )}-${toTimestamp(endTime, SAFE_SEPARATOR)}${extension}`

  return {
    filePath,
    start: startTime,
    end: endTime,
    outputFilename,
  }
}

export const getClipFilename = (state: AppState, clipId: ClipId) =>
  getClipOutputParameters(state, clipId).outputFilename

export const getClipIdsByFilePath = (
  state: AppState,
  filePath: string
): Array<ClipId> => {
  const { clips } = state
  const ids = (Object.keys(clips): any)
  return ids.filter(
    (id: ClipId) => clips[id] && clips[id].filePath === filePath
  )
}
