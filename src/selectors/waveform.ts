export const WAVEFORM_HEIGHT = 50
export const SELECTION_BORDER_WIDTH = 5
export const CLIP_THRESHOLD = 40

export const getWaveform = (state: AppState): WaveformState => state.waveform

export const getWaveformViewBoxXMin = (state: AppState) =>
  state.waveform.viewBox.xMin

export const getHalfSecond = ({ waveform }: AppState) =>
  (waveform.stepsPerSecond * waveform.stepLength) / 2
