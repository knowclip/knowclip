declare type EpicsDependencies = {|
  document: Document,
  window: typeof window,
  setLocalStorage: (string, string) => void,
  getWaveformSvgElement: () => ?HTMLElement,
  getWaveformSvgWidth: () => number,
  getCurrentTime: () => number,
  setCurrentTime: number => void,
  pauseMedia: () => void,
  toggleMediaPaused: () => void,
|}
