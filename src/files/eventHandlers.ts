import { ActionOf } from '../actions'
import A from '../types/ActionType'

export type FileEventHandlers<F extends FileMetadata> = {
  /** should eventually result in openFileSuccess or openFileFailure ? */
  openRequest: OpenFileRequestHandler<F>
  openSuccess: OpenFileSuccessHandler<F>[]
  openFailure?: OpenFileFailureHandler<F>
  /** should eventually result in openFileSuccess or openFileFailure ? */
  locateRequest: LocateFileRequestHandler<F>
  locateSuccess: LocateFileSuccessHandler<F> | null
  deleteRequest: DeleteFileRequestHandler<F>[]
  // DESCENDANTS' DELETE HOOKS ARE NOT TRIGGERED
  deleteSuccess: DeleteFileSuccessHandler[]
}

export type OpenFileRequestHandler<F extends FileMetadata> = (
  validatedFile: F,
  filePath: FilePath,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type OpenFileSuccessHandler<F extends FileMetadata> = (
  validatedFile: F,
  filePath: FilePath,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type OpenFileFailureHandler<F extends FileMetadata> = (
  file: F,
  filePath: FilePath | null,
  errorMessage: string | null,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type LocateFileRequestHandler<F extends FileMetadata> = (
  file: F,
  availability: FileAvailability,
  message: string,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type LocateFileSuccessHandler<F extends FileMetadata> = (
  action: ActionOf<A.locateFileSuccess> & { file: F },
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type DeleteFileRequestHandler<F extends FileMetadata> = (
  file: F | null,
  availability: FileAvailability,
  descendants: Array<FileAvailability>,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

// TODO: DESCENDANTS' DELETE HOOKS ARE NOT TRIGGERED
export type DeleteFileSuccessHandler = (
  action: ActionOf<A.deleteFileSuccess>,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>
