import { switchMap } from 'rxjs/operators'
import * as r from '../redux'
import { ofType } from 'redux-observable'
import { from } from 'rxjs'

const preloadVideoStills: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, PreloadVideoStills>(A.PRELOAD_VIDEO_STILLS),
    switchMap(({ file: mediaFile, clipId }) => {
      const mediaClipIds = r.getClipIdsByMediaFileId(state$.value, mediaFile.id)
      const index = mediaClipIds.indexOf(clipId)
      const adjacentClipsIds = [
        clipId,
        ...mediaClipIds.slice(index + 1, index + 5),
        ...mediaClipIds.slice(Math.max(index - 5, 0), index).reverse(),
      ]

      const actions = adjacentClipsIds
        .map(id => {
          const still = r.getFileWithAvailability<VideoStillImageFile>(
            state$.value,
            'VideoStillImage',
            id
          )
          if (!still.file)
            return r.openFileRequest({
              id,
              type: 'VideoStillImage',
              mediaFileId: mediaFile.id,
            })

          if (still.availability.status === 'CURRENTLY_LOADED') return null

          return !still.availability.isLoading
            ? r.openFileRequest(still.file)
            : null
        })
        .filter((a): a is OpenFileRequest => a !== null)

      return from(actions)
    })
  )

export default preloadVideoStills
