import { fromEvent } from 'rxjs'
import { nowUtcTimestamp, uuid } from './mockable/sideEffects'
import * as electronHelpers from './mockable/electron'
import { getDexieDb } from './utils/dictionariesDatabase'
import * as mediaHelpers from './utils/media'
import { ClipwaveCallbackEvent, WaveformInterface } from 'clipwave'
import { CLIPWAVE_ID } from './utils/clipwave'
import { flushSync } from 'react-dom'
import { IpcRendererEvent } from './preload/IpcRendererEvent'
import { flatten } from './MessageToMain'
import { FfprobeData } from 'fluent-ffmpeg'

const sendToMainProcess: typeof window.electronApi.sendToMainProcess = (
  message
) => {
  if (window.electronApi?.sendToMainProcess)
    return window.electronApi.sendToMainProcess(message)

  throw new Error('sendToMainProcess not available')
}
const sendClosedSignal: typeof window.electronApi.sendClosedSignal = () => {
  if (window.electronApi?.sendClosedSignal)
    return window.electronApi.sendClosedSignal()

  throw new Error('sendClosedSignal not available')
}

const dependencies = {
  ...electronHelpers,
  writeFile: (filePath: string, data: string) =>
    sendToMainProcess({ type: 'writeTextFile', args: [filePath, data] }),
  fileExists: (filePath: string) =>
    sendToMainProcess({ type: 'fileExists', args: [filePath] }),

  window: window,
  getPlatform: () => window.electronApi.platform,
  nowUtcTimestamp,
  uuid,
  getDexieDb,

  fromIpcRendererEvent: <T>(eventName: string) =>
    fromEvent<IpcRendererEvent<T>>(window, `ipc:${eventName}`),
  quitApp: () => sendClosedSignal(),

  dispatchClipwaveEvent: (callback: (waveform: WaveformInterface) => void) => {
    window.dispatchEvent(
      new ClipwaveCallbackEvent(CLIPWAVE_ID, (waveform: WaveformInterface) =>
        flushSync(() => callback(waveform))
      )
    )
  },

  ...mediaHelpers,

  getMediaMetadata: flatten((filePath: string) =>
    sendToMainProcess({ type: 'getMediaMetadata', args: [filePath] })
  ),
  getSubtitlesFromFile: flatten(
    (sourceFilePath: string, extension: '.srt' | '.vtt' | '.ass') =>
      sendToMainProcess({
        type: 'getSubtitlesFromFile',
        args: [sourceFilePath, extension],
      })
  ),
  getSubtitlesFilePath: flatten(
    (
      options:
        | {
            type: 'ExternalSubtitlesFile' | 'VttFromExternalSubtitles'
            file: VttFromExternalSubtitles
            sourceFilePath: string
          }
        | {
            type: 'VttFromEmbeddedSubtitles'
            file: VttFromEmbeddedSubtitles
            mediaMetadata: FfprobeData
            sourceFilePath: string
          }
    ) =>
      sendToMainProcess({
        type: 'getSubtitlesFilePath',
        args: [options],
      })
  ),
  getWaveformPng: flatten(
    (
      fileAvailability: FileAvailability,
      file: WaveformPng,
      mediaFilePath: string
    ) =>
      sendToMainProcess({
        type: 'getWaveformPng',
        args: [fileAvailability, file, mediaFilePath],
      })
  ),
  getWaveformPngs: (mediaFile: MediaFile) =>
    sendToMainProcess({
      type: 'getWaveformPngs',
      args: [mediaFile],
    }),
  getVideoStill: flatten(
    (clipId: ClipId, videoFilePath: string, seconds: number) =>
      sendToMainProcess({
        type: 'getVideoStill',
        args: [clipId, videoFilePath, seconds],
      })
  ),
  getApkgExportData: (
    state: AppState,
    project: ProjectFile,
    mediaIdToClipsIds: ReviewAndExportDialogData['mediaFileIdsToClipIds']
  ) =>
    sendToMainProcess({
      type: 'getApkgExportData',
      args: [state, project, mediaIdToClipsIds],
    }),
  processNoteMedia: flatten(
    (clipSpecs: ClipSpecs, destinationFolder: string, saveImages?: string) =>
      sendToMainProcess({
        type: 'processNoteMedia',
        args: [clipSpecs, destinationFolder, saveImages],
      })
  ),
  readdir: (path: string) =>
    sendToMainProcess({ type: 'readdir', args: [path] }),
  readMediaFile: flatten(
    (
      filePath: string,
      id: string,
      projectId: string,
      subtitles: MediaFile['subtitles'] = [],
      flashcardFieldsToSubtitlesTracks: SubtitlesFlashcardFieldsLinks = {}
    ) =>
      sendToMainProcess({
        type: 'readMediaFile',
        args: [
          filePath,
          id,
          projectId,
          subtitles,
          flashcardFieldsToSubtitlesTracks,
        ],
      })
  ),
  parseProjectJson: flatten((filePath: string) =>
    sendToMainProcess({ type: 'parseProjectJson', args: [filePath] })
  ),
  writeApkgDeck: (outputFilePath: string, exportData: ApkgExportData) =>
    sendToMainProcess({
      type: 'writeApkgDeck',
      args: [outputFilePath, exportData],
    }),
  validateSubtitleFileBeforeOpen: flatten(
    <S extends SubtitlesFile>(sourceFilePath: string, existingFile: S) =>
      sendToMainProcess({
        type: 'validateSubtitleFileBeforeOpen',
        args: [sourceFilePath, existingFile],
      })
  ),
  validateSubtitlesFromFilePath: flatten(
    (sourceFilePath: string, existingFile: SubtitlesFile) =>
      sendToMainProcess({
        type: 'validateSubtitlesFromFilePath',
        args: [sourceFilePath, existingFile],
      })
  ),
  openDictionaryFile: flatten((file: DictionaryFile, filePath: string) =>
    sendToMainProcess({
      type: 'openDictionaryFile',
      args: [file, filePath],
    })
  ),
  registerFilePath: (fileId: string, filePath: string) =>
    sendToMainProcess({
      type: 'registerFilePath',
      args: [fileId, filePath],
    }),
  showAboutDialog: (message: string) =>
    sendToMainProcess({
      type: 'showAboutDialog',
      args: [message],
    }),
  setAppMenuProjectSubmenuPermissions: (bool: boolean) =>
    sendToMainProcess({
      type: 'setAppMenuProjectSubmenuPermissions',
      args: [bool],
    }),
}

export default dependencies

export type EpicsDependencies = typeof dependencies
