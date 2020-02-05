declare type EpicsDependencies = {
  document: Document
  window: typeof window
  getCurrentWindow: () => Electron.BrowserWindow
  getWaveformSvgElement: () => SVGElement | null
  getWaveformSvgWidth: () => number
  getCurrentTime: () => number
  setCurrentTime: (seconds: number) => void
  isMediaPlaying: () => boolean
  pauseMedia: () => void
  playMedia: () => void
  toggleMediaPaused: () => void
  getMediaMetadata: (
    path: string
  ) => Promise<
    | {
        streams: import('fluent-ffmpeg').FfprobeStream[]
        format: import('fluent-ffmpeg').FfprobeFormat
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
  getVideoStill: typeof import('../utils/getVideoStill').getVideoStill
  getConstantBitrateMediaPath: (
    path: string,
    oldConstantBitratePath: string | null // not needed
  ) => Promise<string>
  existsSync: (string) => boolean
  ipcRenderer: Electron.IpcRenderer
  nowUtcTimestamp: () => string
}
