import * as r from '../redux'
import { empty } from 'rxjs'
import {
  LoadSuccessHandler,
  LoadRequestHandler,
  LocateRequestHandler,
  FileEventHandlers,
} from './eventHandlers'

export const loadRequest: LoadRequestHandler<WaveformPngRecord> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  return [await r.loadFileSuccess(fileRecord, filePath)]
}

export const loadSuccess: LoadSuccessHandler<WaveformPngRecord> = (
  fileRecord,
  filePath,
  state,
  effects
) => empty()

export const locateRequest: LocateRequestHandler<WaveformPngRecord> = async (
  { fileRecord },
  state,
  effects
) => {
  try {
    const parentFile = r.getLoadedFileById(state, 'MediaFile', fileRecord.id)
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return [
        r.loadFileFailure(fileRecord, null, 'You must first locate this file.'),
      ]

    const cbr = r.getConstantBitrateFilePath(state, parentFile.id)

    return cbr
      ? [
          r.locateFileSuccess(
            fileRecord,
            await effects.getWaveformPng(state, fileRecord, cbr)
          ),
        ]
      : []
  } catch (err) {
    return [
      r.loadFileFailure(fileRecord, null, 'whoops couldnt make waveform image'),
    ]
  }
}

export default {
  loadRequest,
  loadSuccess,
  loadFailure: null,
  locateRequest,
  locateSuccess: null,
} as FileEventHandlers<WaveformPngRecord>
