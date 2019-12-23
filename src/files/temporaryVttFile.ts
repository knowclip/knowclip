import { map } from 'rxjs/operators'
import * as r from '../redux'
import { from } from 'rxjs'
import {
  newExternalSubtitlesTrack,
  newEmbeddedSubtitlesTrack,
} from '../utils/subtitles'
import {
  LoadRequestHandler,
  LoadSuccessHandler,
  LocateRequestHandler,
  FileEventHandlers,
} from './eventHandlers'

const loadRequest: LoadRequestHandler<VttConvertedSubtitlesFile> = async (
  file,
  filePath,
  state,
  effects
) => {
  const parentFile = r.getFileAvailabilityById(
    state,
    file.parentType,
    file.parentId
  )
  if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
    return [
      await r.loadFileFailure(file, null, 'You must first locate this file.'),
    ]

  const vttFilePath = await effects.getSubtitlesFilePath(
    state,
    parentFile.filePath,
    file
  )

  return [r.loadFileSuccess(file, vttFilePath)]
}

const loadSuccess: LoadSuccessHandler<VttConvertedSubtitlesFile> = (
  file,
  filePath,
  state,
  effects
) => {
  const sourceFile = r.getFileAvailabilityById(
    state,
    file.parentType,
    file.parentId
  ) as CurrentlyLoadedFile
  return from(effects.getSubtitlesFromFile(state, filePath)).pipe(
    map(chunks => {
      if (file.parentType === 'MediaFile')
        return r.addSubtitlesTrack(
          newEmbeddedSubtitlesTrack(
            file.id,
            file.parentId,
            chunks,
            file.streamIndex,
            filePath
          )
        )

      const external = r.getFile(
        state,
        'ExternalSubtitlesFile',
        file.parentId
      ) as ExternalSubtitlesFile
      return r.addSubtitlesTrack(
        newExternalSubtitlesTrack(
          file.id,
          external.parentId,
          chunks,
          sourceFile.filePath,
          filePath
        )
      )
    })
  )
}
const locateRequest: LocateRequestHandler<VttConvertedSubtitlesFile> = async (
  { file },
  state,
  effects
) => {
  // if parent file/media track exists
  const source = r.getFileAvailabilityById(
    state,
    file.parentType,
    file.parentId
  )
  if (source && source.status === 'CURRENTLY_LOADED') {
    //   try loading that again
    const sourceRecord: MediaFile | ExternalSubtitlesFile | null = r.getFile(
      state,
      file.parentType,
      file.parentId
    )
    // how to prevent infinite loop?
    if (!sourceRecord)
      return [r.simpleMessageSnackbar('No source subtitles file ')]

    switch (file.parentType) {
      case 'MediaFile': {
        return await Promise.all(
          (sourceRecord as MediaFile).subtitlesTracksStreamIndexes.map(
            async streamIndex => {
              const tmpFilePath = await effects.getSubtitlesFilePath(
                state,
                source.filePath,
                file
              )
              return r.locateFileSuccess(file, tmpFilePath)
            }
          )
        )
      }
      case 'ExternalSubtitlesFile':
        const tmpFilePath = await effects.getSubtitlesFilePath(
          state,
          source.filePath,
          file
        )
        return [r.locateFileSuccess(file, tmpFilePath)]
      default:
        //   delete file record, suggest retry?
        return [r.simpleMessageSnackbar('Whoops no valid boop source??')]

      // else
    }
  }
  return [r.simpleMessageSnackbar('Whoops no valid boop source??')]
}

export default {
  loadRequest,
  loadSuccess,
  loadFailure: null,
  locateRequest,
  locateSuccess: null,
} as FileEventHandlers<VttConvertedSubtitlesFile>
