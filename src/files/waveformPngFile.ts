import * as r from '../redux'
import { empty } from 'rxjs'
import {
  LoadSuccessHandler,
  LoadRequestHandler,
  LocateRequestHandler,
  FileEventHandlers,
} from './eventHandlers'

export const loadRequest: LoadRequestHandler<WaveformPng> = async (
  file,
  filePath,
  state,
  effects
) => {
  return [await r.loadFileSuccess(file, filePath)]
}

export const loadSuccess: LoadSuccessHandler<WaveformPng> = (
  file,
  filePath,
  state,
  effects
) => empty()

export const locateRequest: LocateRequestHandler<WaveformPng> = async (
  { file },
  state,
  effects
) => {
  try {
    const parentFile = r.getFileAvailabilityById(state, 'MediaFile', file.id)
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return [r.loadFileFailure(file, null, 'You must first locate this file.')]

    const cbr = r.getConstantBitrateFilePath(state, parentFile.id)

    return cbr
      ? [
          r.locateFileSuccess(
            file,
            await effects.getWaveformPng(state, file, cbr)
          ),
        ]
      : []
  } catch (err) {
    return [r.loadFileFailure(file, null, 'whoops couldnt make waveform image')]
  }
}

export default {
  loadRequest,
  loadSuccess,
  loadFailure: null,
  locateRequest,
  locateSuccess: null,
} as FileEventHandlers<WaveformPng>
