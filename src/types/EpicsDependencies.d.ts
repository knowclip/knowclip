/// <reference path="../utils/ffmpeg" />

declare type EpicsDependencies = {
  document: Document
  window: typeof window
  getCurrentWindow: () => Electron.BrowserWindow
  setLocalStorage: ((key: string, value: string) => void)
  getLocalStorage: (key: string) => string | null
  getWaveformSvgElement: (() => SVGElement | null)
  getWaveformSvgWidth: (() => number)
  getCurrentTime: (() => number)
  setCurrentTime: ((seconds: number) => void)
  isMediaPlaying: () => boolean
  pauseMedia: (() => void)
  toggleMediaPaused: (() => void)
  getMediaMetadata: (
    path: string
  ) => Promise<
    | {
        streams: FfprobeStream[]
        format: FfprobeFormat
        chapters: any[]
      }
    | Error
  >
  getSubtitlesFromFile: (
    state: AppState,
    sourceFilePath: string
  ) => Promise<SubtitlesChunk[]>
  getSubtitlesFilePath: (
    state: AppState,
    sourceFilePath: string,
    file: ExternalSubtitlesFile | VttConvertedSubtitlesFile
  ) => Promise<string>
  getWaveformPng: (
    state: AppState,
    file: WaveformPng,
    constantBitrateFilePath: string
  ) => Promise<string | Error>
  getConstantBitrateMediaPath: (
    path: string,
    oldConstantBitratePath: string | null // not needed
  ) => Promise<string>
  existsSync: (string) => boolean
  ipcRenderer: Electron.IpcRenderer
  nowUtcTimestamp: () => string
}
