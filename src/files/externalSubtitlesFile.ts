import { map } from 'rxjs/operators'
import * as r from '../redux'
import { from, of } from 'rxjs'
import { newExternalSubtitlesTrack } from '../utils/subtitles'
import { FileEventHandlers } from './eventHandlers'
import { extname } from 'path'

const isVtt = (filePath: FilePath) => extname(filePath) === '.vtt'

export default {
  openRequest: async (file, filePath, state, effects) => [
    r.openFileSuccess(file, filePath),
  ],

  openSuccess: (file, filePath, state, effects) => {
    if (isVtt(filePath)) {
      return from(effects.getSubtitlesFromFile(state, filePath)).pipe(
        map(chunks =>
          r.addSubtitlesTrack(
            newExternalSubtitlesTrack(
              file.id,
              file.parentId,
              chunks,
              filePath,
              filePath
            )
          )
        )
      )
    } else {
      return of(
        r.addAndOpenFile({
          type: 'VttConvertedSubtitlesFile',
          id: file.id,
          parentId: file.id, // not needed?
          parentType: 'ExternalSubtitlesFile',
        })
      )
    }
  },

  openFailure: (file, filePath, errorMessage, state, effects) =>
    of(r.fileSelectionDialog(errorMessage, file)),

  locateRequest: async ({ file, message }, state, effects) => {
    return [r.fileSelectionDialog(message, file)]
  },

  locateSuccess: null,
} as FileEventHandlers<ExternalSubtitlesFile>
