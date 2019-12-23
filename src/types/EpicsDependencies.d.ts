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
  ) => Promise<string>
  getConstantBitrateMediaPath: (
    path: string,
    oldConstantBitratePath: string | null // not needed
  ) => Promise<string>
  existsSync: (string) => boolean
}
