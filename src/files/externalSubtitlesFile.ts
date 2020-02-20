import * as r from '../redux'
import { newExternalSubtitlesTrack } from '../utils/subtitles'
import { FileEventHandlers } from './eventHandlers'
import { extname } from 'path'

const isVtt = (filePath: FilePath) => extname(filePath) === '.vtt'

export default {
  openRequest: async ({ file }, filePath, state, effects) => [
    // maybe we can tell if this is the first time
    // opening this file by checking the fileAvailability status?
    // currently new files are NEVER_LOADED when they are added
    // to fileAvailabilites
    //
    // but NEVER_LOADED is also for files that were loaded from shared projects.
    // so then we would need to have a new status NEWLY_ADDED or something
    // to b able to do that there.
    //
    // so maybe the way to go for showing this linkSubtitlesDialog
    // at the right time would be to have an epic around the
    // action MOUNT_SUBTITLES_TRACK?
    //
    // but MOUNT_SUBTITLES_TRACK is being triggered AFTER the subtitles
    // file is added, so now i'm confused...
    //
    // in any event, the ideal flow would go something like:
    // 1 open media file with embedded subtitles
    // 2 embedded subtitles files are added
    // 3 for newly added embedded subtitles, show link subtitles dialog
    // 4 mount subtitles with any links
    // and for external, similarly
    // 1 external subtitles file is added
    // 2 show link subtitles dialog
    // 3 mount subtitles with any links
    //
    // maybe the issue is that the add-file is triggering the
    //  mount + connection between media+subtitles,
    //  when the connection should trigger the add + the mount

    r.openFileSuccess(file, filePath),
  ],

  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      if (isVtt(filePath)) {
        const chunks = await effects.getSubtitlesFromFile(state, filePath)
        const track = newExternalSubtitlesTrack(
          validatedFile.id,
          validatedFile.parentId,
          chunks,
          filePath,
          filePath
        )
        const mediaFile = r.getFile<MediaFile>(
          state,
          'MediaFile',
          validatedFile.parentId
        )
        return [
          ...(mediaFile && !mediaFile.subtitles.some(s => s.id === track.id)
            ? [
                r.addSubtitlesTrack(track),
                ...(state.dialog.queue.some(d => d.type === 'SubtitlesClips')
                  ? []
                  : [r.linkSubtitlesDialog(validatedFile, mediaFile.id)]),
              ]
            : []),
          r.mountSubtitlesTrack(track), // maybe should only do this after linkSubtitlesDialog in case this is first time mounting,
        ]
      } else {
        const vttFile = r.getFile(
          state,
          'VttConvertedSubtitlesFile',
          validatedFile.id
        )
        return [
          r.openFileRequest(
            vttFile || {
              type: 'VttConvertedSubtitlesFile',
              id: validatedFile.id,
              parentId: validatedFile.id, // not needed?
              parentType: 'ExternalSubtitlesFile',
            }
          ),
        ]
      }
    },
  ],

  locateRequest: async ({ file, message }, availability, state, effects) => {
    return [r.fileSelectionDialog(message, file)]
  },

  locateSuccess: null,

  deleteRequest: [
    async (file, availability, descendants, state, effects) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],

  deleteSuccess: [
    async (action, state, effects) => {
      const mediaFile = Object.values(state.files.MediaFile).find(
        m => m && m.subtitles.some(({ id }) => id === action.file.id)
      )
      return mediaFile
        ? [r.deleteSubtitlesTrackFromMedia(action.file.id, mediaFile.id)]
        : []
    },
  ],
} as FileEventHandlers<ExternalSubtitlesFile>
