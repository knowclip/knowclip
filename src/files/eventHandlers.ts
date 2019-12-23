import { Observable } from 'rxjs'

export type LoadRequestHandler<F extends FileMetadata> = (
  file: F,
  filePath: string,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type LoadSuccessHandler<F extends FileMetadata> = (
  file: F,
  filePath: string,
  state: AppState,
  effects: EpicsDependencies
) => Observable<Action>

export type LoadFailureHandler<F extends FileMetadata> = (
  file: F,
  filePath: string | null,
  errorMessage: string,
  state: AppState,
  effects: EpicsDependencies
) => Observable<Action>

export type LocateRequestHandler<F extends FileMetadata> = (
  action: LocateFileRequest & { file: F },
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type FileValidator = <F>(
  existingFile: F,
  path: string
) => Promise<string | F>

export type FileEventHandlers<F extends FileMetadata> = {
  // openRequest
  loadRequest: LoadRequestHandler<F>
  // open
  loadSuccess: LoadSuccessHandler<F>
  // openFailure
  loadFailure: LoadFailureHandler<F> | null
  // locateRequest
  locateRequest: LocateRequestHandler<F>
  // locate
  locateSuccess: LoadSuccessHandler<F> | null

  readFile: (filePath: string) => Promise<F>
}
