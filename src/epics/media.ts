import { flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import { getMediaMetadata, convertMediaMetadata } from '../utils/ffmpeg'
import uuid from 'uuid/v4'
import { AppEpic } from '../types/AppEpic'

// when the user is creating a new file record, no validation.
// when loading a file from an existing file record, validate the newly loaded file against the existing one.
const loadMediaFileRecord = async (filePath: string, id: string, projectId: string): Promise<MediaFileRecord> => {
  const ffprobeMetadata = await getMediaMetadata(filePath)
  const metadata = convertMediaMetadata(
    ffprobeMetadata,
    filePath,
    uuid()
  )

  return {
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
  }
}

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
            return r.addAndLoadFile(
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

export default addMediaToProject
