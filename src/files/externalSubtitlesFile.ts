import { map } from 'rxjs/operators'
import * as r from '../redux'
import { from, of } from 'rxjs'
import { newExternalSubtitlesTrack } from '../utils/subtitles'
import { FileEventHandlers } from './eventHandlers'
import { extname } from 'path'

const isVtt = (filePath: FilePath) => extname(filePath) === '.vtt'

export default {
  loadRequest: async (fileRecord, filePath, state, effects) => [
    r.loadFileSuccess(fileRecord, filePath),
  ],

  loadSuccess: (fileRecord, filePath, state, effects) => {
    if (isVtt(filePath)) {
      return from(effects.getSubtitlesFromFile(state, filePath)).pipe(
        map(chunks =>
          r.addSubtitlesTrack(
            newExternalSubtitlesTrack(
              fileRecord.id,
              fileRecord.parentId,
              chunks,
              filePath,
              filePath
            )
          )
        )
      )
    } else {
      return of(
        r.addAndLoadFile({
          type: 'TemporaryVttFile',
          id: fileRecord.id,
          parentId: fileRecord.id, // not needed?
          parentType: 'ExternalSubtitlesFile',
        })
      )
    }
  },

  loadFailure: (fileRecord, filePath, errorMessage, state, effects) =>
    of(r.fileSelectionDialog(errorMessage, fileRecord)),

  locateRequest: async ({ fileRecord, message }, state, effects) => {
    return [r.fileSelectionDialog(message, fileRecord)]
  },

  locateSuccess: null,
} as FileEventHandlers<ExternalSubtitlesFileRecord>
