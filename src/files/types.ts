import { Observable } from 'rxjs'

// export type AddHandler<F extends FileRecord> = (
//   fileRecord: F,
//   filePath: string,
//   state: AppState,
//   effects: EpicsDependencies
// ) => Observable<Action>

export type LoadRequestHandler<F extends FileRecord> = (
  fileRecord: F,
  filePath: string,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type LoadSuccessHandler<F extends FileRecord> = (
  fileRecord: F,
  filePath: string,
  state: AppState,
  effects: EpicsDependencies
) => Observable<Action>

export type LoadFailureHandler<F extends FileRecord> = (
  fileRecord: F,
  filePath: string | null,
  errorMessage: string,
  state: AppState,
  effects: EpicsDependencies
) => Observable<Action>

export type LocateRequestHandler<F extends FileRecord> = (
  fileRecord: F,
  state: AppState,
  effects: EpicsDependencies
) => Promise<Array<Action>>

export type FileEventHandlers<F extends FileRecord> = {
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
  validateFile?: (file: F, path: string) => string[] // check differences? or do this in another handler?
}
