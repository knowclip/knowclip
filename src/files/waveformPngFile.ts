import { map } from 'rxjs/operators'
import * as r from '../redux'
import { from, of, empty } from 'rxjs'
import { newExternalSubtitlesTrack } from '../utils/subtitles'
import {
  LoadSuccessHandler,
  LoadFailureHandler,
  LoadRequestHandler,
} from './types'
import { extname } from 'path'

export const loadRequest: LoadRequestHandler<WaveformPngRecord> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  const file = r.getPreviouslyLoadedFile(state, fileRecord)

  if (!file || !file.filePath) {
    const parentFile = r.getLoadedFileById(state, 'MediaFile', fileRecord.id)
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return await r.loadFileFailure(
        fileRecord,
        null,
        'You must first locate this file.'
      )

    const imagePath = await effects.getWaveformPng(state, parentFile.filePath) // cbr

    return r.loadFileSuccess(fileRecord, imagePath)
  }

  if (!file.filePath || !effects.existsSync(file.filePath))
    return await r.loadFileFailure(
      fileRecord,
      file.filePath,
      `This file appears to have moved or been renamed. y`
    )

  return await r.loadFileSuccess(fileRecord, file.filePath)
}

export const loadSuccess: LoadSuccessHandler<WaveformPngRecord> = (
  fileRecord,
  filePath,
  state,
  effects
) => empty()

export const loadFailure: LoadFailureHandler<WaveformPngRecord> = (
  fileRecord,
  filePath,
  errorMessage,
  state,
  effects
) => of(r.fileSelectionDialog(errorMessage, fileRecord))
