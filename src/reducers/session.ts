import { Reducer } from 'redux'
import A from '../types/ActionType'
import deleteKey from '../utils/deleteKey'
import { areSelectionsEqual } from '../utils/waveformSelection'

const initialState: SessionState = {
  waveformSelection: null,
  defaultTags: [],
  defaultIncludeStill: true,
  currentMediaFileId: null,
  currentProjectId: null,
  workIsUnsaved: false,
  tagsToClipIds: {},
  loopMedia: false,
  progress: null,
  editingCards: false,
  dictionaryPopoverIsOpen: false,
}

const session: Reducer<SessionState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.deleteCard:
      return state.waveformSelection &&
        state.waveformSelection.type === 'Clip' &&
        action.id === state.waveformSelection.id
        ? { ...state, waveformSelection: null, loopMedia: false }
        : state

    case A.deleteCards:
      return state.waveformSelection &&
        state.waveformSelection.type === 'Clip' &&
        action.ids.includes(state.waveformSelection.id)
        ? { ...state, waveformSelection: null, loopMedia: false }
        : state

    case A.updateFile: {
      const { update } = action as UpdateFileWith<any>
      const updateName: keyof FileUpdates = update.updateName

      switch (updateName) {
        case 'deleteProjectMedia': {
          const mediaFileId = (action as UpdateFileWith<'deleteProjectMedia'>)
            .update.updatePayload[0]
          return state.currentMediaFileId === mediaFileId
            ? {
                ...state,
                currentMediaFileId: null,
                waveformSelection: null,
                editingCards: false,
              }
            : state
        }
        case 'linkFlashcardFieldToSubtitlesTrack':
          return {
            ...state,
            waveformSelection:
              state.waveformSelection &&
              state.waveformSelection.type === 'Preview'
                ? null
                : state.waveformSelection,
          }
        default:
          return state
      }
    }

    case A.openProject:
      return {
        ...state,
        currentProjectId: action.project.id,
      }

    case A.closeProject:
      return initialState

    case A.openFileRequest:
      if (action.file.type === 'MediaFile')
        return {
          ...state,
          currentMediaFileId: action.file.id,
        }

      return state

    case A.addClip:
      return {
        ...state,
        editingCards: action.startEditing,
      }

    case A.selectWaveformItem: {
      let loopMedia: LoopState = state.loopMedia
      if (
        state.editingCards &&
        action.selection &&
        action.selection.type === 'Clip'
      ) {
        loopMedia = 'EDIT'
      } else if (action.selection && action.selection.type === 'Preview') {
        loopMedia = false
      }
      return areSelectionsEqual(state.waveformSelection, action.selection)
        ? state
        : {
            ...state,
            waveformSelection: action.selection,
            loopMedia,
          }
    }

    case A.mergeClips:
      return {
        ...state,
        waveformSelection: action.newSelection,
      }

    case A.setDefaultClipSpecs:
      return {
        ...state,
        defaultTags: action.tags || state.defaultTags,
        defaultIncludeStill:
          action.includeStill !== undefined
            ? action.includeStill
            : state.defaultIncludeStill,
      }

    case A.setAllTags:
      return {
        ...state,
        tagsToClipIds: action.tagsToClipIds,
      }

    case A.addFlashcardTag: {
      const { text, id } = action
      const ids = state.tagsToClipIds[text] || []

      if (ids.includes(id)) return state

      return {
        ...state,
        tagsToClipIds: {
          ...state.tagsToClipIds,
          [text]: [...ids, id],
        },
      }
    }

    case A.deleteFlashcardTag: {
      const { tag } = action
      const newIds = (state.tagsToClipIds[tag] || []).filter(
        (id: string) => id !== action.id
      )
      const newTagsToClipIds = newIds.length
        ? {
            ...state.tagsToClipIds,
            [tag]: newIds,
          }
        : deleteKey({ ...state.tagsToClipIds }, tag)

      return {
        ...state,
        tagsToClipIds: newTagsToClipIds,
      }
    }

    case A.setWorkIsUnsaved:
      return {
        ...state,
        workIsUnsaved: action.workIsUnsaved,
      }

    case A.toggleLoop:
      return {
        ...state,
        loopMedia: state.loopMedia ? false : action.reason,
      }

    case A.setLoop: {
      if (!action.loop || !state.loopMedia)
        return {
          ...state,
          loopMedia: action.loop,
        }
      return state
    }

    case A.setProgress:
      return {
        ...state,
        progress: action.progress,
      }

    case A.dismissMedia:
      return { ...state, currentMediaFileId: null, waveformSelection: null }

    case A.startEditingCards:
      return { ...state, editingCards: true, loopMedia: 'EDIT' }

    case A.stopEditingCards:
      return { ...state, editingCards: false, loopMedia: false }

    case A.openDictionaryPopover:
      return { ...state, dictionaryPopoverIsOpen: true }

    case A.closeDictionaryPopover:
      return { ...state, dictionaryPopoverIsOpen: false }

    default:
      return state
  }
}

export default session
