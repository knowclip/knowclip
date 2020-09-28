import { Reducer } from 'redux'
import { fileUpdates } from '../files/updates'
import * as A from '../types/ActionType'

export const initialState: FilesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  VttConvertedSubtitlesFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  VideoStillImage: {},
  YomichanDictionary: {},
  CEDictDictionary: {},
  DictCCDictionary: {},
}

type FindByTag<Union, Tag> = Union extends { type: Tag } ? Union : never

/** deprecated: prefer update action */
/** CAREFUL: TS type inference is broken here, so don't forget return type for `transform`! */
const edit = <T extends FileMetadata['type']>(
  state: FilesState,
  type: T,
  id: string,
  /** CAREFUL: TS type inference is broken here, so don't forget return type! */
  transform: (file?: FindByTag<FileMetadata, T>) => FindByTag<FileMetadata, T>
) => {
  const substate = state[type] as Dict<string, FindByTag<FileMetadata, T>>

  const newValue = transform(substate[id])
  const newState: FilesState = {
    ...state,
    [type]: {
      ...substate,
      [id]: newValue,
    },
  }
  return newState
}

const files: Reducer<FilesState, Action> = (state = initialState, action) => {
  switch (action.type) {
    case A.OPEN_FILE_SUCCESS:
      return {
        ...state,
        [action.validatedFile.type]: {
          ...state[action.validatedFile.type],
          [action.validatedFile.id]: action.validatedFile,
        },
      }
    case A.ADD_FILE:
    case A.OPEN_FILE_REQUEST: {
      const newState = {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: {
            ...state[action.file.type][action.file.id], // needed?
            ...action.file,
          },
        },
      }
      if (action.file.type === 'MediaFile') {
        const parentProjectFile = state.ProjectFile[action.file.parentId]
        if (!parentProjectFile) {
          console.error(
            `Action ${action.type} was dispatched during illegal state.`
          )
          console.log(action, state, newState)
          // should be impossible
          return newState
        }

        if (!parentProjectFile.mediaFileIds.includes(action.file.id))
          return edit(
            newState,
            'ProjectFile',
            action.file.parentId,
            (file): ProjectFile => {
              return {
                ...parentProjectFile,
                ...file,
                mediaFileIds: [
                  ...new Set([
                    ...(file || parentProjectFile).mediaFileIds,
                    action.file.id,
                  ]),
                ],
              }
            }
          )
      }
      return newState
    }

    case A.UPDATE_FILE:
      return updateFile(state, action.update, action)

    case A.DELETE_FILE_SUCCESS: {
      const newState = {} as typeof state
      for (const t in state) {
        const type = t as keyof typeof state
        // @ts-ignore
        newState[type] = { ...state[type] }
      }

      delete newState[action.file.type][action.file.id]

      for (const descendant of action.descendants) {
        delete newState[descendant.type][descendant.id]
      }
      return newState
    }

    default:
      return state
  }
}

export default files

function updateFile<U extends keyof FileUpdates>(
  state: FilesState,
  update: FileUpdate<U>,
  action: UpdateFile
) {
  const updateMethod = fileUpdates[update.updateName]
  const existingFile = state[updateMethod.type][update.id]
  if (!existingFile) {
    console.error(`Action ${action.type} was dispatched during illegal state.`)
    console.log(action, state)
    // should be impossible
    return state
  }

  const newState: FilesState = {
    ...state,
    [updateMethod.type]: {
      ...state[updateMethod.type],
      [update.id]: updateMethod.update(
        existingFile as any,
        ...(update.updatePayload as any)
      ),
    },
  }
  return newState
}
