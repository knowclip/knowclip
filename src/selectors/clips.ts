import { getMillisecondsAtX } from './waveformTime'

export const getClipMilliseconds = (state: AppState, id: ClipId): {
  start: number,
  end: number
} => {
  const clip = state.clips.byId[id]
  if (!clip) throw new Error('Maybe impossible')
  return {
    start: getMillisecondsAtX(state, clip.start),
    end: getMillisecondsAtX(state, clip.end),
  }
}

export const getClipIdsByMediaFileId = (state: AppState, mediaFileId: string): Array<ClipId> => state.clips.idsByMediaFileId[mediaFileId]

export const getDefaultTags = (state: AppState): Array<string> => state.user.defaultTags
