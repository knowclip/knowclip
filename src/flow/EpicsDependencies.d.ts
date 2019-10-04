declare type EpicsDependencies = {
  document: Document
  window: typeof window
  setLocalStorage: ((arg0: string, arg1: string) => void)
  getWaveformSvgElement: (() => HTMLElement | null)
  getWaveformSvgWidth: (() => number)
  getCurrentTime: (() => number)
  setCurrentTime: ((arg0: number) => void)
  pauseMedia: (() => void)
  toggleMediaPaused: (() => void)
}
