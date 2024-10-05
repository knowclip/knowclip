import { Reducer } from 'redux'
import { fileUpdates } from '../files/updates'
import A from '../types/ActionType'
import { ActionOf } from '../actions'

export const initialState: FilesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  VttConvertedSubtitlesFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  VideoStillImage: {},
  Dictionary: {},
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
    case A.openFileSuccess:
      return {
        ...state,
        [action.validatedFile.type]: {
          ...state[action.validatedFile.type],
          [action.validatedFile.id]: action.validatedFile,
        },
      }
    case A.addFile:
    case A.openFileRequest: {
      const newState = {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: {
            ...action.file,
            ...state[action.file.type][action.file.id],
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

    case A.updateFile:
      return updateFile(state, action.update, action)

    case A.deleteFileSuccess: {
      const newState = {} as typeof state
      for (const t in state) {
        const type = t as keyof typeof state
        // @ts-expect-error compiler doesn't understand matching of keys/properties
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

function updateFile<U extends FileUpdateName>(
  state: FilesState,
  update: FileUpdate<U>,
  action: ActionOf<A.updateFile>
) {
  const updateMethod = fileUpdates[update.updateName]
  const existingFile = state[update.fileType][update.id]
  if (!existingFile) {
    console.error(`Action ${action.type} was dispatched during illegal state.`)
    console.log(action, state)
    // should be impossible
    return state
  }

  const newState: FilesState = {
    ...state,
    [update.fileType]: {
      ...state[update.fileType],
      [update.id]: updateMethod(
        existingFile,
        // @ts-expect-error compiler doesn't understand matching of keys/properties
        ...update.updatePayload
      ),
    },
  }
  return newState
}
