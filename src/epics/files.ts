import { filter, flatMap, map } from 'rxjs/operators'
import { of, Observable } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'
import { AppEpic } from '../types/AppEpic'
import { getSubtitlesFromFile } from './subtitles'

// const isLoadSubtitlesRequest = (
//   action: Action
// ): action is LoadFileRequest & { fileRecord: ExternalSubtitlesFileRecord } =>
//   action.type === A.LOAD_FILE_REQUEST &&
//   action.fileRecord.type === 'ExternalSubtitlesFile'

const isCreateFileRecord = <F extends FileRecord>(
  fileRecordType: F['type']
) => (action: Action): action is CreateFileRecord & { fileRecord: F } =>
  action.type === A.CREATE_FILE_RECORD &&
  action.fileRecord.type === fileRecordType

// const isCreateFileRecordSuccess = <F extends FileRecord>(
//   fileRecordType: F['type']
// ) => (action: Action): action is CreateFileRecordSuccess & { fileRecord: F } =>
//   action.type === A.CREATE_FILE_RECORD_SUCCESS &&
//   action.fileRecord.type === fileRecordType

const isLoadFileRequest = <F extends FileRecord>(fileRecordType: F['type']) => (
  action: Action
): action is LoadFileRequest & { fileRecord: F } =>
  action.type === A.LOAD_FILE_REQUEST &&
  action.fileRecord.type === fileRecordType

const isLoadFileSuccess = <F extends FileRecord>(fileRecordType: F['type']) => (
  action: Action
): action is LoadFileSuccess & { fileRecord: F } =>
  action.type === A.LOAD_FILE_SUCCESS &&
  action.fileRecord.type === fileRecordType

const isLoadFileFailure = <F extends FileRecord>(fileRecordType: F['type']) => (
  action: Action
): action is LoadFileFailure & { fileRecord: F } =>
  action.type === A.LOAD_FILE_FAILURE &&
  action.fileRecord.type === fileRecordType

const isLocateFileRequest = <F extends FileRecord>(
  fileRecordType: F['type']
) => (action: Action): action is LocateFileRequest & { fileRecord: F } =>
  action.type === A.LOCATE_FILE_REQUEST &&
  action.fileRecord.type === fileRecordType

// LOADING A NEW VTT SUBTITLES FILE
//   1 click "Add external subtitles", triggering createFileRecord action
//   2 update file records state + loaded files state with new FileRecord
//   3 try to load LoadedFile using FileRecord
//   4 load file was successful (because 2), so update loaded files state to 'CURRENTLY_LOADED' + update subtitles state
// LOADING A NEW SRT/OTHER SUBTITLES FILE
//   1 click "Add external subtitles", triggering createFileRecord action
//   2 update file records state + loaded files state with new FileRecord
//   3 try to load LoadedFile using FileRecord
//   4 load file was successful (because 2), so update loaded file state to 'CURRENTLY LOADED' + createFileRecord for vtt file
// GENERATING A VTT FILE CONVERTED FROM AN SRT/OTHER SUBTITLES FILE
//   1 createFileRecord action is triggered on successful loading of SRT file
//   2 update file records state + loaded files state with new FileRecord
//   3 try to load LoadedFile using FileRecord
//   4 load file was successful (because 2), so update loaded file state to 'CURRENTLY LOADED' + generate VTT file and update subtitles state
// LOADING A PREVIOUSLY LOADED (from project file) VTT SUBTITLES FILE
//   1 action triggered, try to load file using FileRecord
//   2 if file present in filesystem:
//        load file was successful, so update loaded file state to 'CURRENTLY LOADED' + update subtitles state
//     if file absent:
//        load file failed, so show dialog to locate external subtitles file
// LOADING A PREVIOUSLY LOADED (from project file) SRT/OTHER SUBTITLES FILE
//   1 action is triggered, try to load file using FileRecord
//   2 if file present in filesystem:
//       load file was successful, so update loaded file state to 'CURRENTLY LOADED' +  createFileRecord for vtt file
//     if file absent:
//       load file failed, so show dialog to locate external subtitles file from parent media file
// LOADING A PREVIOUSLY LOADED CONVERTED VTT SUBTITLES FILE
//   1 action is triggered, try to load file using FileRecord
//   2 if file present in filesystem (indexedDB or tmp file?):
//       load file was successful, so update loaded file state to 'CURRENTLY LOADED' + update subtitles state
//     if file absent:
//       load file failed, so try to generate tmp? file from parent subtitles track (embedded or external file)

// LOADING A NEW MEDIA FILE
//   - click "Add media file", triggering createFileRecord action
//   - update file records state + loaded files state with new FileRecord
//   - try to locate-or-generate LoadedFile using FileRecord

export const createSubtitlesFileRecord: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(isCreateFileRecord('ExternalSubtitlesFile')),
    map<CreateFileRecord, Action>(({ fileRecord }) =>
      r.loadFileRequest(fileRecord)
    )
  )

const isVtt = (filePath: FilePath) => true

export const loadSubtitlesFileRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    // filter<Action, LoadFileRequest>(isLoadSubtitlesRequest),
    filter<Action, LoadFileRequest>(
      isLoadFileRequest<ExternalSubtitlesFileRecord>('ExternalSubtitlesFile')
    ),
    // if filepath provided, try to locate file
    //   if filepath valid, loadFileSuccess
    //   if filepath invalid, do file-generating or file-finding action for particular file type
    // if no filepath provided, do file-generating or file-finding action for particular file type
    flatMap<LoadFileRequest, Promise<Action>>(async ({ fileRecord }) => {
      const file = r.getPreviouslyLoadedFile(state$.value, fileRecord)
      if (!file) return await r.loadFileFailure(fileRecord, null, 'no file')
      try {
        if (isVtt(file.filePath)) {
          const { chunks, vttFilePath } = await getSubtitlesFromFile(
            file.filePath,
            state$.value
          )
          return await r.loadFileSuccess(fileRecord, file.filePath)
        } else {
          return await r.loadFileSuccess(fileRecord, file.filePath)
        }
      } catch (err) {
        return await r.loadFileFailure(
          fileRecord,
          file ? file.filePath : null,
          err.message || err.toString()
        )
      }
    })
  )

export const loadSubtitlesFileFailure: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(isLoadFileFailure('ExternalSubtitlesFile')),
    map<LoadFileFailure, Promise<Action>>(async ({ fileRecord, filePath, errorMessage }) => {
      const file = r.getPreviouslyLoadedFile(state$.value, fileRecord)
        if (filePath) {
          // something went wrong with file at path
          //   if it was found but something went wrong anyway, show error dialog
          //   if it wasnt found, show locate dialog
        } else {
          // there was no remembered path, so show locate dialog
        }
      }
    })
  )

export const loadSubtitlesFileSuccess: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(isLoadFileSuccess('ExternalSubtitlesFile')),
    map<LoadFileSuccess, Promise<Action>>(async ({ fileRecord }) => {
      const file = r.getPreviouslyLoadedFile(state$.value, fileRecord)
      if (file && file.filePath)
        return await r.loadFileSuccess(fileRecord, file.filePath)

      const { chunks, vttFilePath } = await getSubtitlesFromFile(
        file.filePath,
        state$.value
      )
    })
  )

// or should be loadSubtitlesFromFileRequest?
export const locateSubtitlesFileRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    // filter<Action, CreateFileRecordRequest<ExternalSubtitlesFileRecord>>(
    //   isCreateFileRecord<ExternalSubtitlesFileRecord>('ExternalSubtitlesFile')
    // ),
    filter(isLocateFileRequest('ExternalSubtitlesFile')),
    flatMap<
      LocateFileRequest & { fileRecord: ExternalSubtitlesFileRecord },
      Promise<Observable<Action>>
    >(async a => {
      const { filePath, fileRecord } = a
      try {
        const { chunks, vttFilePath } = await getSubtitlesFromFile(
          filePath,
          state$.value
        )

        const actions = [
          // r.loadExternalSubtitlesSuccess(fileRecord),
          // r.locateFileSuccess(fileRecord, filePat)
          //
          // r.createFileRecord<ExternalSubtitlesFileRecord>(
          //   {
          //     type: 'ExternalSubtitlesFile',
          //     id: uuid(),
          //     parentId: fileRecord.parentId,
          //   },
          //   fileaAth // vttFilePath
          // ),
          // r.loadFileRequest,
        ]

        return await from(actions)
      } catch (err) {
        console.error(err.message)
        return await of(
          //
          r.simpleMessageSnackbar(
            `Could not load subtitles:${err.message || err.toString()}`
          )
        )
      }
    }),
    flatMap(x => x)
  )

export const locateSubtitlesFile: AppEpic = (action$, state$) =>
  action$.pipe(
    filter<Action, LocateFileRequest>(
      isLocateFileRequest<ExternalSubtitlesFileRecord>('ExternalSubtitlesFile')
    ),
    flatMap<LocateFileRequest, Promise<Action>>(async ({ fileRecord }) => {
      return fileRecord.id
    })
  )

// // export const handleLocate: Record<
// //   FileRecord['type'],
// //   (
// //     action: LocateFileRequest,
// //     state: AppState,
// //     epicsDependencies: EpicsDependencies
// //   ) => LocateFileSuccess | LocateFileFailure | null
// // > = {
// //   ExternalSubtitlesFile: () => null,
// //   ProjectFile: () => null,
// //   MediaFile: () => null,
// //   ConvertedVttFile: () => null,
// //   WaveformPng: () => null,
// //   ConstantBitrateMp3: () => null,
// //   VideoStillImage: () => null,
// // }
// export const handleLocate = (
//   action: LocateFileRequest,
//   state: AppState,
//   epicsDependencies: EpicsDependencies
// ): LocateFileSuccess | LocateFileSuccess | Action => {
//   switch (action.fileRecord.type) {
//     case 'ExternalSubtitlesFile': {
//       // return action.fileRecord
//     }
//     // case 'ProjectFile':
//     //   return
//     // case 'MediaFile':
//     //   return
//     // case 'ConvertedVttFile':
//     //   return
//     // case 'WaveformPng':
//     //   return
//     // case 'ConstantBitrateMp3':
//     //   return
//     // case 'VideoStillImage':
//     //   return
//     default:
//       return { type: 'NOOP' } as Action
//   }
// }
