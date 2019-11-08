declare type EpicsDependencies = {
  document: Document
  window: typeof window
  setLocalStorage: ((arg0: string, arg1: string) => void)
  getWaveformSvgElement: (() => SVGElement | null)
  getWaveformSvgWidth: (() => number)
  getCurrentTime: (() => number)
  setCurrentTime: ((arg0: number) => void)
  pauseMedia: (() => void)
  toggleMediaPaused: (() => void)
  getMediaMetadata: (
    path: string
  ) => Promise<{
    streams: FfprobeStream[]
    format: FfprobeFormat
    chapters: any[]
  }>
  getSubtitlesFromFile: (
    filePath: string,
    state: AppState
  ) => Promise<{
    vttFilePath: string
    chunks: SubtitlesChunk[]
  }>
  getSubtitlesFromMedia: (
    mediaFilePath: string,
    streamIndex: number,
    state: AppState
  ) => Promise<{
    tmpFilePath: string
    chunks: SubtitlesChunk[]
  }>
  getWaveformPng: (
    state: AppState,
    constantBitrateFilePath: string
  ) => Promise<string>
  getConstantBitrateMediaPath: (
    path: string,
    oldConstantBitratePath: string | null // not needed
  ) => Promise<string>
  existsSync: (string) => boolean
}
