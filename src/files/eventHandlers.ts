export type FileEventHandlers<F extends FileMetadata> = {
  openRequest: OpenFileRequestHandler<F>
  openSuccess: OpenFileSuccessHandler<F>[]
  openFailure?: OpenFileFailureHandler<F>
  locateRequest: LocateFileRequestHandler<F>
  locateSuccess: LocateFileSuccessHandler<F> | null
  deleteRequest: DeleteFileRequestHandler<F>[]
  // DESCENDANTS' DELETE HOOKS ARE NOT TRIGGERED
  deleteSuccess: DeleteFileSuccessHandler[]
}

export type OpenFileRequestHandler<F extends FileMetadata> = (
  action: OpenFileRequest & { file: F },
  filePath: FilePath,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type OpenFileSuccessHandler<F extends FileMetadata> = (
  action: OpenFileSuccess & { validatedFile: F },
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type OpenFileFailureHandler<F extends FileMetadata> = (
  action: OpenFileFailure & { file: F },
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type LocateFileRequestHandler<F extends FileMetadata> = (
  action: LocateFileRequest & { file: F },
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type LocateFileSuccessHandler<F extends FileMetadata> = (
  action: LocateFileSuccess & { file: F },
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

// DESCENDANTS' DELETE HOOKS ARE NOT TRIGGERED
export type DeleteFileSuccessHandler = (
  action: DeleteFileSuccess,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>
