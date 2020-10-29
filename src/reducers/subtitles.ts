import { Reducer } from 'redux'
import A from '../types/ActionType'

const initialState: SubtitlesState = {}

const subtitles: Reducer<SubtitlesState> = (
  state: SubtitlesState = initialState,
  action: Action
) => {
  switch (action.type) {
    case A.mountSubtitlesTrack:
      return { ...state, [action.track.id]: action.track }

    case A.openFileRequest:
      return action.file.type === 'MediaFile' ? initialState : state

    case A.hideSubtitles:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          mode: 'disabled',
        } as SubtitlesTrack,
      }

    case A.showSubtitles:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          mode: 'showing',
        } as SubtitlesTrack,
      }
    case A.updateFile: {
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
