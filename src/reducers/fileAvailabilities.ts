import { Reducer } from 'redux'

export const initialState: FileAvailabilitiesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  VttConvertedSubtitlesFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  VideoStillImage: {},
}

const fileAvailabilities: Reducer<FileAvailabilitiesState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.LOAD_PERSISTED_STATE:
      return action.fileAvailabilities || state

    case A.OPEN_FILE_REQUEST: {
      const type = action.file.type
      const byType = state[type]
      const base = byType[action.file.id]
      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: base
            ? {
                id: base.id,
                status: base.status,
                // does the action need filepath even?
                filePath: action.filePath || base.filePath,
                isLoading: true,
              }
            : {
                id: action.file.id,
                status: 'NEVER_LOADED',
                filePath: action.filePath,
                isLoading: true,
              },
        },
      }
    }

    case A.OPEN_FILE_SUCCESS: {
      const fileAvailability: FileAvailability = {
        type: action.validatedFile.type,
        id: action.validatedFile.id,
        parentId:
          'parentId' in action.validatedFile
            ? action.validatedFile.parentId
            : null,
        name:
          'name' in action.validatedFile
            ? action.validatedFile.name
            : action.validatedFile.type,
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: action.filePath,
        lastOpened: action.timestamp,
      }
      return {
        ...state,
        [action.validatedFile.type]: {
          ...state[action.validatedFile.type],
          [action.validatedFile.id]: fileAvailability,
        },
      }
    }

    case A.OPEN_FILE_FAILURE: {
      const base = state[action.file.type][action.file.id]
      const newAvailability: KnownFile = base
        ? {
            id: action.file.id,
            type: action.file.type,
            parentId: base.parentId,
            name: base.name,
            filePath: base.filePath,
            status: 'FAILED_TO_LOAD',
            isLoading: false,
            lastOpened: base.lastOpened,
          }
        : {
            id: action.file.id,
            type: action.file.type,
            parentId: 'parentId' in action.file ? action.file.parentId : null,
            name: 'name' in action.file ? action.file.name : action.file.type,
            filePath: null,
            status: 'FAILED_TO_LOAD',
            isLoading: false,
            lastOpened: null,
          }
      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: newAvailability,
        },
      }
    }

    case A.ADD_FILE: {
      const base = state[action.file.type][action.file.id]
      const newAvailability: KnownFile = base || {
        filePath: null,
        status: 'NEVER_LOADED',
        id: action.file.id,
        type: action.file.type,
        parentId: 'parentId' in action.file ? action.file.parentId : null,
        name: 'name' in action.file ? action.file.name : action.file.type,
        isLoading: false,
        lastOpened: null,
      }
      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: newAvailability,
        },
      }
    }
    case A.LOCATE_FILE_SUCCESS: {
      const base = state[action.file.type][action.file.id]
      if (!base) return state // really shouldn't happen

      const newAvailability: KnownFile = {
        ...base,
        filePath: action.filePath,
      }

      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: newAvailability,
        },
      }
    }

    case A.DELETE_FILE_SUCCESS: {
      const deleted = getDeletedFile(action.file)

      {
        const newState = {} as typeof state
        for (const t in state) {
          const type = t as keyof typeof state
          // @ts-ignore
          newState[type] = { ...state[type] }
        }

        newState[action.file.type][action.file.id] = deleted

        for (const descendant of action.descendants) {
          newState[descendant.type][descendant.id] = getDeletedFile(descendant)
        }
        return newState
      }
    }

    case A.COMMIT_FILE_DELETIONS: {
      const newState = {} as typeof state

      for (const t in state) {
        const type: keyof typeof state = t as any
        const files = state[type]

        newState[type] = {} as typeof files

        for (const id in files) {
          const file = newState[type][id]
          if (file && file.status !== 'PENDING_DELETION')
            newState[type][id] = file
        }
      }

      return newState
    }

    default:
      return state
  }
}

const getDeletedFile = (file: FileAvailability): PendingDeletionFile => {
  const { filePath, lastOpened } = file
  const newAvailability: KnownFile =
    filePath && lastOpened
      ? {
          id: file.id,
          type: file.type,
          parentId: file.parentId,
          name: file.name,
          filePath: filePath,
          lastOpened: lastOpened,
          status: 'PENDING_DELETION',
          isLoading: false,
        }
      : {
          id: file.id,
          type: file.type,
          parentId: file.parentId,
          name: file.name,
          filePath: null,
          lastOpened: null,
          status: 'PENDING_DELETION',
          isLoading: false,
        }
  return newAvailability
}

export default fileAvailabilities
