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
) => Promise<Action>

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
