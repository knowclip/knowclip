import r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import { msToSeconds } from 'clipwave'

const videoStillImageFileEventHandlers: FileEventHandlers<VideoStillImageFile> =
  {
    openRequest: async (file, filePath, state, effects) => {
      const img = new Image()
      img.src = new URL(
        r.fileByIdUrl(state.session.localServerAddress, file.id)
      ).toString()
      return await new Promise((res, _rej) => {
        const onLoad = () => {
          res([r.openFileSuccess(file, filePath, effects.nowUtcTimestamp())])
          img.removeEventListener('load', onLoad)
        }
        const onError = (e: any) => {
          res([r.openFileFailure(file, filePath, String(e))])
          img.removeEventListener('error', onLoad)
        }
        img.addEventListener('load', onLoad)
        img.addEventListener('error', onError)
      })
    },
    openSuccess: [
      async (_validatedFile, _filePath) => {
        return []
      },
    ],
    locateRequest: async (file, _availability, _message, state, effects) => {
      try {
        const parentFile = r.getFile<MediaFile>(
          state,
          'MediaFile',
          file.mediaFileId
        )
        const parentFileAvailability = r.getFileAvailabilityById<MediaFile>(
          state,
          'MediaFile',
          file.mediaFileId
        )
        if (
          !parentFile ||
          !parentFileAvailability ||
          parentFileAvailability.status !== 'CURRENTLY_LOADED'
        )
          return [r.openFileFailure(file, null, null)]

        const loadedMediaFilePath = r.getLoadedMediaFilePath(
          state,
          parentFile.id
        )
        if (!loadedMediaFilePath)
          return [
            r.openFileFailure(
              file,
              null,
              "Can't make still image from video until it has loaded."
            ),
          ]

        const flashcard = r.getFlashcard(state, file.id)
        const clip = r.getClip(state, file.id)
        if (!flashcard)
          return [
            r.openFileFailure(
              file,
              null,
              "Can't make a still for a flashcard that doesn't exist."
            ),
          ]

        if (!clip)
          return [
            r.openFileFailure(
              file,
              null,
              "Can't make a still for a clip that doesn't exist."
            ),
          ]

        const seconds =
          typeof flashcard.image?.seconds === 'number'
            ? flashcard.image.seconds
            : msToSeconds(getMidpoint(clip.start, clip.end))

        const pngPath = await effects.getVideoStill(
          file.id,
          parentFileAvailability.filePath,
          seconds
        )
        if (pngPath.error)
          return [
            r.openFileFailure(
              file,
              null,
              'Could not locate file: ' +
                (pngPath.error.message ||
                  'problem generating still image from media.')
            ),
          ]

        return [r.locateFileSuccess(file, pngPath.value)]
      } catch (err) {
        return [
          r.openFileFailure(
            file,
            null,
            `Problem making still image from media: ${err}`
          ),
        ]
      }
    },
    locateSuccess: null,
    deleteRequest: [
      async (_file, availability, descendants) => [
        r.deleteFileSuccess(availability, descendants),
      ],
    ],
    deleteSuccess: [],
  }

export default videoStillImageFileEventHandlers

export const getMidpoint = (start: number, end: number) =>
  start + Math.round((end - start) / 2)
