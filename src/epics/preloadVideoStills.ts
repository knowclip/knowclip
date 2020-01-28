import { AppEpic } from '../types/AppEpic'
import { flatMap, switchMap } from 'rxjs/operators'
import * as r from '../redux'
import { ofType } from 'redux-observable'
import { from, empty } from 'rxjs'

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
      console.log(
        clipId,
        mediaClipIds.slice(index + 1, index + 5),
        mediaClipIds.slice(Math.max(index - 5, 0), index).reverse()
      )

      const actions = adjacentClipsIds
        .map(id => {
          console.log({ id })
          const still = r.getFileWithAvailability<VideoStillImageFile>(
            state$.value,
            'VideoStillImage',
            id
          )
          if (!still.file)
            return r.addAndOpenFile<VideoStillImageFile>({
              id,
              type: 'VideoStillImage',
              mediaFileId: mediaFile.id,
            })

          if (still.availability.status === 'CURRENTLY_LOADED') return null

          return !still.availability.isLoading
            ? r.openFileRequest(still.file)
            : null
        })
        .filter((a): a is AddAndOpenFile | OpenFileRequest => a !== null)

      return from(actions)

      //   videoStill: r.getFileWithAvailability<VideoStillImageFile>(
      //     state,
      //     'VideoStillImage',
      //     clip.id
      //   ),
      //   mediaFileAvailability: r.getFileAvailability(state, videoFile),
      //   clipsIds: r.getClipIdsByMediaFileId(state, videoFile.id),
      //   videoStillAvailabilities: state.fileAvailabilities.VideoStillImage,
      // }))

      // const dispatch = useDispatch()

      // useEffect(
      //   () => {
      //     const adjacentClipActions = () => {
      //       const currentIndex = clipsIds.indexOf(clip.id)

      //       const adjacentIdsx = [
      //         clip.id,
      //         ...clipsIds.slice(currentIndex + 1, currentIndex + 5),
      //         ...clipsIds
      //           .slice(Math.max(currentIndex - 5, 0), currentIndex)
      //           .reverse(),
      //       ]
      //       const adjacentIds = [
      //         clip.id,
      //         ...clipsIds.slice(currentIndex + 1, currentIndex + 5),
      //       ]
      //       console.log(
      //         Math.max(currentIndex - 5, 0),
      //         currentIndex,
      //         clipsIds.slice(Math.max(currentIndex - 5, 0), currentIndex)
      //       )

      //       return adjacentIds
      //         .map(id => {
      //           const availability =
      //             id in videoStillAvailabilities
      //               ? videoStillAvailabilities[id]
      //               : null
      //           if (!availability)
      //             return r.addAndOpenFile({
      //               type: 'VideoStillImage',
      //               id,
      //               mediaFileId: videoFile.id,
      //             })

      //           // MUST ADD VIDEOSTILLIMAGE FILES WHEN OPENING PROJECT

      //           const { status, isLoading } = availability
      //           return !isLoading &&
      //             mediaFileAvailability.status === 'CURRENTLY_LOADED'
      //             ? r.openFileRequest({
      //                 type: 'VideoStillImage',
      //                 id,
      //                 mediaFileId: videoFile.id,
      //               })
      //             : null
      //         })
      //         .filter(a => a)
      //     }
    })
  )

export default preloadVideoStills
