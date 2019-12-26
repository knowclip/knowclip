import { Observable } from 'rxjs'

export type FileEventHandlers<F extends FileMetadata> = {
  openRequest: OpenFileRequestHandler<F>
  openSuccess: OpenFileSuccessHandler<F>
  openFailure: OpenFileFailureHandler<F> | null
  locateRequest: LocateFileRequestHandler<F>
  locateSuccess: LocateFileSuccessHandler<F> | null
}

export type OpenFileRequestHandler<F extends FileMetadata> = (
  file: F,
  filePath: string,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type OpenFileSuccessHandler<F extends FileMetadata> = (
  file: F,
  filePath: string,
  state: AppState,
  effects: EpicsDependencies
) => Observable<Action>

export type OpenFileFailureHandler<F extends FileMetadata> = (
  file: F,
  filePath: string | null,
  errorMessage: string,
  state: AppState,
  effects: EpicsDependencies
) => Observable<Action>

export type LocateFileRequestHandler<F extends FileMetadata> = (
  action: LocateFileRequest & { file: F },
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type LocateFileSuccessHandler<F extends FileMetadata> = (
  action: LocateFileRequest & { file: F },
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>
