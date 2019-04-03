// @flow

import { basename, extname } from 'path'
import { toTimestamp } from '../utils/ffmpeg'
import { getMillisecondsAtX } from './waveformTime'
// import { getMediaFilePath } from './audio'

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

// export const getClipMediaFilePath = (state: AppState, clipId: ClipId): ?MediaFilePath =>

export const getClipIdsByMediaFileId = (
  state: AppState,
  mediaFileId: string
): Array<ClipId> => state.clips.idsByMediaFileId[mediaFileId]

export const haveClipsBeenMade = (state: AppState): boolean =>
  Object.keys(state.clips.byId).length > 0

export const getDefaultTags = (state: AppState): Array<string> =>
  state.user.defaultTags
