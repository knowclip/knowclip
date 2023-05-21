import { Reducer } from 'redux'
import A from '../types/ActionType'
import { getHumanFileName } from '../utils/files'
import { ActionOf } from '../actions'

export const initialState: FileAvailabilitiesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  VttConvertedSubtitlesFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  VideoStillImage: {},
  Dictionary: {},
}

const fileAvailabilities: Reducer<FileAvailabilitiesState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.openFileRequest: {
      const type = action.file.type
      const byType = state[type]
      const base = byType[action.file.id]

      const newFile: KnownFile =
        base && base.status !== 'PENDING_DELETION'
          ? getLoadingFile(base, action)
          : {
              id: action.file.id,
              type: action.file.type,
              parentId: 'parentId' in action.file ? action.file.parentId : null,
              name:
                'name' in action.file
                  ? action.file.name
                  : 'Unknown ' + getHumanFileName(action.file),
              status: 'NEVER_LOADED',
              filePath: action.filePath,
              lastOpened: null,
              isLoading: true,
            }

      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: newFile,
        },
      }
    }

    case A.openFileSuccess: {
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

    case A.openFileFailure: {
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

    case A.addFile: {
      const base = state[action.file.type][action.file.id]
      if (!action.path && base) return state

      const newAvailability: KnownFile =
        base && action.path
          ? { ...base, filePath: action.path }
          : {
              filePath: action.path || null,
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
    case A.locateFileSuccess: {
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

    case A.deleteFileSuccess: {
      const newState = {} as typeof state
      for (const t in state) {
        const type = t as keyof typeof state
        newState[type] = { ...state[type] }
      }

      newState[action.file.type][action.file.id] = getDeletedFile(action.file)

      for (const descendant of action.descendants) {
        newState[descendant.type][descendant.id] = getDeletedFile(descendant)
      }
      return newState
    }

    case A.commitFileDeletions: {
      const newState = { ...state }

      for (const t of 'fileType' in action
        ? [action.fileType]
        : Object.keys(state)) {
        const type: keyof typeof state = t as any
        const files = state[type]

        newState[type] = {} as typeof files

        for (const id in files) {
          const file = state[type][id]
          if (file && file.status !== 'PENDING_DELETION')
            newState[type][id] = file
        }
      }

      return newState
    }

    case A.abortFileDeletions: {
      const newState = {} as typeof state

      for (const t in state) {
        const type: keyof typeof state = t as any
        const files = state[type]

        newState[type] = {} as typeof files

        for (const id in files) {
          const file = state[type][id]
          if (file) {
            const newFile: KnownFile =
              file.status === 'PENDING_DELETION'
                ? resetPendingDeletionFile(file)
                : file
            newState[type][id] = newFile
          }
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

export const resetPendingDeletionFile = (
  file: PendingDeletionFile
): KnownFile => {
  if (file.filePath && file.lastOpened) {
    const previouslyLoadedFile: PreviouslyLoadedFile = {
      id: file.id,
      status: 'PREVIOUSLY_LOADED',
      filePath: file.filePath,
      parentId: file.parentId,
      lastOpened: file.lastOpened,
      isLoading: false,
      name: file.name,
      type: file.type,
    }
    return previouslyLoadedFile
  }

  const neverLoadedFile: NeverLoadedFile = {
    id: file.id,
    status: 'NEVER_LOADED',
    filePath: null,
    parentId: file.parentId,
    lastOpened: null,
    isLoading: false,
    name: file.name,
    type: file.type,
  }
  return neverLoadedFile
}

const getLoadingFile = (
  base:
    | PreviouslyLoadedFile
    | ErroredFile
    | CurrentlyLoadedFile
    | NeverLoadedFile,
  action: ActionOf<A.openFileRequest>
): KnownFile => {
  switch (base.status) {
    case 'PREVIOUSLY_LOADED':
      return {
        id: base.id,
        type: base.type,
        parentId: base.parentId,
        name: base.name,
        status: 'PREVIOUSLY_LOADED',
        // does the action need filepath even?
        filePath: action.filePath || base.filePath,
        isLoading: true,
        lastOpened: base.lastOpened,
      }
    case 'CURRENTLY_LOADED':
      return {
        id: base.id,
        type: base.type,
        parentId: base.parentId,
        name: base.name,
        status: 'PREVIOUSLY_LOADED',
        // does the action need filepath even?
        filePath: action.filePath || base.filePath,
        isLoading: true,
        lastOpened: base.lastOpened,
      }

    case 'FAILED_TO_LOAD':
      return {
        id: base.id,
        type: base.type,
        parentId: base.parentId,
        name: base.name,
        status: 'FAILED_TO_LOAD',
        // does the action need filepath even?
        filePath: action.filePath || base.filePath,
        isLoading: true,
        lastOpened: base.lastOpened,
      }

    case 'NEVER_LOADED':
      return {
        id: base.id,
        type: base.type,
        parentId: base.parentId,
        name: base.name,
        status: 'NEVER_LOADED',
        // does the action need filepath even?
        filePath: action.filePath || base.filePath,
        isLoading: true,
        lastOpened: base.lastOpened,
      }
  }
}

export default fileAvailabilities
