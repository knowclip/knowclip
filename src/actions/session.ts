import A from '../types/ActionType'
import { KnowclipActionCreatorsSubset } from '.'
import { FfprobeData } from 'fluent-ffmpeg'

export const sessionActions = {
  dismissMedia: () => ({ type: A.dismissMedia }),

  setMediaMetadata: (metadata: FfprobeData) => ({
    type: A.setMediaMetadata,
    metadata,
  }),

  toggleLoop: (reason: LoopReason) => ({
    type: A.toggleLoop,
    reason,
  }),

  setLoop: (loop: LoopState) => ({
    type: A.setLoop,
    loop,
  }),

  setViewMode: (viewMode: ViewMode) => ({
    type: A.setViewMode,
    viewMode,
  }),
} satisfies KnowclipActionCreatorsSubset
