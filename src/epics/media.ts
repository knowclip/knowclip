import { flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import { getMediaMetadata, convertMediaMetadata } from '../utils/ffmpeg'
import uuid from 'uuid/v4'
import { AppEpic } from '../types/AppEpic'

const addMediaToProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddMediaToProjectRequest>(A.ADD_MEDIA_TO_PROJECT_REQUEST),
    flatMap<AddMediaToProjectRequest, Promise<Array<Action>>>(async a => {
      const { projectId, filePaths } = a
      try {
        // use ffprobe to get metadata for all files
        return await Promise.all(
          filePaths.map(async filePath => {
            const ffprobeMetadata = await getMediaMetadata(filePath)
            const metadata = convertMediaMetadata(
              ffprobeMetadata,
              filePath,
              uuid()
            )
            return r.addFile(
              {
                id: metadata.id,
                type: 'MediaFile',
                parentId: projectId,

                subtitles: [],
                flashcardFieldsToSubtitlesTracks: {},

                name: metadata.name,
                durationSeconds: metadata.durationSeconds,
                format: metadata.format,
                isVideo: metadata.isVideo,
                subtitlesTracksStreamIndexes:
                  metadata.subtitlesTracksStreamIndexes,
              },
              filePath
            )
          })
        )
      } catch (err) {
        console.log(err)
        return [
          r.simpleMessageSnackbar(`Error adding media file: ${err.message}`),
        ]
      }
    }),
    flatMap(x => x)
  )

const getDifferenceMessage = (
  existingMetadata: MediaFileMetadata,
  newMetadata: MediaFileMetadata
) => {
  if (existingMetadata.id !== newMetadata.id)
    throw new Error("Metadata IDs don't match")

  const differences = []

  if (existingMetadata.name !== newMetadata.name) differences.push('name')
  if (existingMetadata.durationSeconds !== newMetadata.durationSeconds)
    differences.push('duration')
  if (existingMetadata.durationSeconds !== newMetadata.durationSeconds)
    differences.push('format')
  if (
    existingMetadata.subtitlesTracksStreamIndexes.sort().toString() !==
    newMetadata.subtitlesTracksStreamIndexes.sort().toString()
  )
    differences.push('subtitles tracks')

  if (differences.length) {
    return `This media file differs from the one on record by: ${differences.join(
      ', '
    )}.`
  }
}

export default addMediaToProject
