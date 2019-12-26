export type FileEventHandlers<F extends FileMetadata> = {
  openRequest: OpenFileRequestHandler<F>
  openSuccess: OpenFileSuccessHandler<F>[]
  locateRequest: LocateFileRequestHandler<F>
  locateSuccess: LocateFileSuccessHandler<F> | null
  deleteRequest: DeleteFileRequestHandler<F>[]
  deleteSuccess: DeleteFileSuccessHandler<F> | null
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
  file: F,
  filePath: string | null,
  errorMessage: string,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Action>

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
  action: DeleteFileRequest & { file: F },
  fileAvailability: CurrentlyLoadedFile | NotCurrentlyLoadedFile & { file: F },
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type DeleteFileSuccessHandler<F extends FileMetadata> = (
  action: DeleteFileSuccess & { file: F },
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>
