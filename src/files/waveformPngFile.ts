import * as r from '../redux'
import { empty } from 'rxjs'
import {
  OpenFileSuccessHandler,
  OpenFileRequestHandler,
  LocateFileRequestHandler,
  FileEventHandlers,
} from './eventHandlers'

export const loadRequest: OpenFileRequestHandler<WaveformPng> = async (
  file,
  filePath,
  state,
  effects
) => {
  return [await r.openFileSuccess(file, filePath)]
}

export const loadSuccess: OpenFileSuccessHandler<WaveformPng> = (
  file,
  filePath,
  state,
  effects
) => empty()

export const locateRequest: LocateFileRequestHandler<WaveformPng> = async (
  { file },
  state,
  effects
) => {
  try {
    const parentFile = r.getFileAvailabilityById(state, 'MediaFile', file.id)
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return [r.openFileFailure(file, null, 'You must first locate this file.')]

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
    return [r.openFileFailure(file, null, 'whoops couldnt make waveform image')]
  }
}

export default {
  openRequest: loadRequest,
  openSuccess: loadSuccess,
  openFailure: null,
  locateRequest,
  locateSuccess: null,
} as FileEventHandlers<WaveformPng>
