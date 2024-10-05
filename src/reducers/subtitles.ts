import { Reducer } from 'redux'
import A from '../types/ActionType'
import { FileUpdateName } from '../files/FileUpdateName'

const initialState: SubtitlesState = {}

const subtitles: Reducer<SubtitlesState, Action> = (
  state = initialState,
  action
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
        } satisfies SubtitlesTrack,
      }

    case A.showSubtitles:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          mode: 'showing',
        } satisfies SubtitlesTrack,
      }
    case A.updateFile: {
      const { update } = action

      switch (update.updateName) {
        case FileUpdateName.DeleteSubtitlesTrack: {
          const trackId = update.updatePayload[0]
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
