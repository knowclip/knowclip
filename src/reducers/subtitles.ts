import { Reducer } from 'redux'
import * as A from '../types/ActionType'

const initialState: SubtitlesState = {}

const subtitles: Reducer<SubtitlesState> = (
  state: SubtitlesState = initialState,
  action: Action
) => {
  switch (action.type) {
    case A.MOUNT_SUBTITLES_TRACK:
      return { ...state, [action.track.id]: action.track }

    case A.OPEN_FILE_REQUEST:
      return action.file.type === 'MediaFile' ? initialState : state

    case A.HIDE_SUBTITLES:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          mode: 'disabled',
        } as SubtitlesTrack,
      }

    case A.SHOW_SUBTITLES:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          mode: 'showing',
        } as SubtitlesTrack,
      }
    case A.UPDATE_FILE: {
      const { update } = action as UpdateFileWith<any>
      const updateName: keyof FileUpdates = update.updateName

      switch (updateName) {
        case 'deleteSubtitlesTrack': {
          const trackId = (action as UpdateFileWith<'deleteSubtitlesTrack'>)
            .update.updatePayload[0]
          const { [trackId]: _, ...newState } = state
          return newState
        }
        default:
          return state
      }
    }

    default:
      return state
  }
}

export default subtitles
