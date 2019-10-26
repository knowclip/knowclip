import { promisify } from 'util'
import tempy from 'tempy'
import fs from 'fs'
import ffmpeg, { getMediaMetadata } from '../utils/ffmpeg'
import { Epic, ofType, combineEpics } from 'redux-observable'
import { filter, flatMap, map } from 'rxjs/operators'
import { of, Observable } from 'rxjs'
import uuid from 'uuid/v4'
import * as r from '../redux'
import { extname } from 'path'
import { parse, stringifyVtt } from 'subtitle'
import subsrt from 'subsrt'
import newClip from '../utils/newClip'
import { from } from 'rxjs'
import { AppEpic } from '../types/AppEpic'
import { getMillisecondsAtX } from '../selectors'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

export const getSubtitlesFilePathFromMedia = async (
  mediaFilePath: MediaFilePath,
  streamIndex: number
): Promise<string | null> => {
  const mediaMetadata = await getMediaMetadata(mediaFilePath)
  if (
    !mediaMetadata.streams[streamIndex] ||
    mediaMetadata.streams[streamIndex].codec_type !== 'subtitle'
  ) {
    return null
  }
  const outputFilePath = tempy.file({ extension: 'vtt' })

  return await new Promise((res, rej) =>
    ffmpeg(mediaFilePath)
      .outputOptions(`-map 0:${streamIndex}`)
      .output(outputFilePath)
      .on('end', () => {
        res(outputFilePath)
      })
      .on('error', err => {
        console.error(err)
        rej(err)
      })
      .run()
  )
}

export const getSubtitlesFromMedia = async (
  mediaFilePath: MediaFilePath,
  streamIndex: number,
  state: AppState
) => {
  const subtitlesFilePath = await getSubtitlesFilePathFromMedia(
    mediaFilePath,
    streamIndex
  )
  if (!subtitlesFilePath) {
    throw new Error('There was a problem loading embedded subtitles')
  }
  const vttText = await readFile(subtitlesFilePath, 'utf8')

  return {
    tmpFilePath: subtitlesFilePath,
    chunks: parse(vttText)
      .map(vttChunk => r.readVttChunk(state, vttChunk as SubtitlesChunk))
      .filter(({ text }) => text),
  }
}

export const convertAssToVtt = (filePath: string, vttFilePath: string) =>
  new Promise((res, rej) =>
    ffmpeg(filePath)
      .output(vttFilePath)
      .on('end', () => {
        res(vttFilePath)
      })
      .on('error', err => {
        console.error(err)
        rej(err)
      })
      .run()
  )

const parseSubtitles = (
  state: AppState,
  fileContents: string,
  extension: string
) =>
  extension === '.ass'
    ? subsrt
        .parse(fileContents)
        .filter(({ type }) => type === 'caption')
        .map(chunk => r.readSubsrtChunk(state, chunk))
        .filter(({ text }) => text)
    : parse(fileContents)
        .map(vttChunk => r.readVttChunk(state, vttChunk as SubtitlesChunk))
        .filter(({ text }) => text)

export const getSubtitlesFromFile = async (
  filePath: string,
  state: AppState
) => {
  const extension = extname(filePath).toLowerCase()
  const vttFilePath =
    extension === '.vtt' ? filePath : tempy.file({ extension: 'vtt' })
  const fileContents = await readFile(filePath, 'utf8')
  const chunks = parseSubtitles(state, fileContents, extension)

  if (extension === '.ass') await convertAssToVtt(filePath, vttFilePath)
  if (extension === '.srt')
    await writeFile(
      vttFilePath,
      stringifyVtt(
        chunks.map(chunk => ({
          start: getMillisecondsAtX(state, chunk.start),
          end: getMillisecondsAtX(state, chunk.end),
          text: chunk.text,
        }))
      ),
      'utf8'
    )
  return {
    vttFilePath,
    chunks,
  }
}

export const newEmbeddedSubtitlesTrack = (
  id: string,
  mediaFileId: MediaFileId,
  chunks: Array<SubtitlesChunk>,
  streamIndex: number,
  tmpFilePath: string
): EmbeddedSubtitlesTrack => ({
  type: 'EmbeddedSubtitlesTrack',
  id,
  mode: 'showing',
  chunks,
  mediaFileId,
  streamIndex,
  tmpFilePath,
})

export const newExternalSubtitlesTrack = (
  id: string,
  mediaFileId: MediaFileId,
  chunks: Array<SubtitlesChunk>,
  filePath: string,
  vttFilePath: string
): ExternalSubtitlesTrack => ({
  mode: 'showing',
  type: 'ExternalSubtitlesTrack',
  id,
  mediaFileId,
  chunks,
  filePath,
  vttFilePath,
})

// const loadEmbeddedSubtitles: AppEpic = (action$, state$) =>
//   action$.pipe(
//     ofType<Action, OpenMediaFileSuccess>(A.OPEN_MEDIA_FILE_SUCCESS),
//     filter(({ metadata }) =>
//       Boolean(metadata.subtitlesTracksStreamIndexes.length)
//     ),
//     flatMap(
//       async ({ metadata: { subtitlesTracksStreamIndexes, id }, filePath }) => {
//         try {
//           const subtitles = await Promise.all(
//             subtitlesTracksStreamIndexes.map(async streamIndex => {
//               const { tmpFilePath, chunks } = await getSubtitlesFromMedia(
//                 filePath,
//                 streamIndex,
//                 state$.value
//               )
//               return newEmbeddedSubtitlesTrack(
//                 uuid(),
//                 id,
//                 chunks,
//                 streamIndex,
//                 tmpFilePath
//               )
//             })
//           )
//           return r.loadEmbeddedSubtitlesSuccess(subtitles, id)
//         } catch (err) {
//           console.error(err)
//           return r.loadSubtitlesFailure(err.message || err.toString())
//         }
//       }
//     )
//   )

// const loadSubtitlesFailure: AppEpic = (action$, state$) =>
//   action$.pipe(
//     ofType<Action, LoadSubtitlesFailure>(A.LOAD_SUBTITLES_FAILURE),
//     map(({ error }) =>
//       r.simpleMessageSnackbar(`Could not load subtitles: ${error}`)
//     )
//   )

// export const locateSubtitlesFile: AppEpic = (action$, state$) =>
//   action$.pipe(
//     filter<Action, LocateFileRequest>(
//       isLocateFileRequest<ExternalSubtitlesFileRecord>('ExternalSubtitlesFile')
//     ),
//     flatMap<LocateFileRequest, Promise<Action>>(async ({ fileRecord }) => {
//       return fileRecord.id
//     })
//   )

// export const loadSubtitlesFile: AppEpic = (action$, state$) =>
//   action$.pipe(
//     ofType<Action, LoadSubtitlesFromFileRequest>(
//       A.LOAD_SUBTITLES_FROM_FILE_REQUEST
//     ),
//     flatMap(async ({ filePath }) => {
//       try {
//         const { chunks, vttFilePath } = await getSubtitlesFromFile(
//           filePath,
//           state$.value
//         )
//         const currentMediaMetadata = r.getCurrentMediaMetadata(state$.value)
//         if (!currentMediaMetadata) throw new Error('No media loaded')
//         return await r.loadExternalSubtitlesSuccess(
//           [
//             newExternalSubtitlesTrack(
//               uuid(),
//               currentMediaMetadata.id,
//               chunks,
//               filePath,
//               vttFilePath
//             ),
//           ],
//           currentMediaMetadata.id
//         )
//       } catch (err) {
//         console.error(err.message)
//         return await r.loadSubtitlesFailure(err.message || err.toString())
//       }
//     })
//   )

const makeClipsFromSubtitles: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, MakeClipsFromSubtitles>(A.MAKE_CLIPS_FROM_SUBTITLES),
    flatMap<MakeClipsFromSubtitles, Observable<Action>>(
      ({ fileId, fieldNamesToTrackIds, tags }) => {
        const transcriptionTrackId = fieldNamesToTrackIds.transcription
        const transcriptionTrack = r.getSubtitlesTrack(
          state$.value,
          transcriptionTrackId
        )
        if (!transcriptionTrack)
          return of(
            r.simpleMessageSnackbar(
              'Could not find subtitles track to match with transcription field.'
            )
          )

        const currentNoteType = r.getCurrentNoteType(state$.value)
        const currentFile = r.getCurrentMediaMetadata(state$.value)
        if (!currentNoteType) throw new Error('Could not find note type.') // should be impossible
        if (!currentFile) throw new Error('Could not find media file.') // should be impossible

        const clips = transcriptionTrack.chunks
          .sort(({ start: a }, { start: b }) => a - b)
          .map(chunk => {
            const fields =
              currentNoteType === 'Simple'
                ? {
                    transcription: chunk.text,
                    meaning: '',
                    notes: '',
                  }
                : {
                    transcription: chunk.text,
                    meaning: '',
                    notes: '',
                    pronunciation: '',
                  }
            ;(Object.keys(fields) as Array<keyof typeof fields>).forEach(
              fieldName => {
                const trackId = fieldNamesToTrackIds[fieldName]
                fields[fieldName] = trackId
                  ? r
                      .getSubtitlesChunksWithinRange(
                        state$.value,
                        trackId,
                        chunk.start,
                        chunk.end
                      )
                      .map(chunk => chunk.text)
                      .join(' ')
                  : ''
              }
            )

            return newClip(chunk, fileId, uuid(), fields, tags)
          })

        return from([
          r.deleteCards(
            r.getClipIdsByMediaFileId(state$.value, currentFile.id)
          ),
          ...Object.keys(fieldNamesToTrackIds).map(badTypefieldName => {
            const fieldName = badTypefieldName as FlashcardFieldName
            return r.linkFlashcardFieldToSubtitlesTrack(
              fieldName,
              currentFile.id,
              fieldNamesToTrackIds[fieldName]
            )
          }),
          r.addClips(clips, fileId),
          r.highlightClip(clips[0].id),
        ])
      }
    )
  )

const subtitlesClipsDialogRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, ShowSubtitlesClipsDialogRequest>(
      A.SHOW_SUBTITLES_CLIPS_DIALOG_REQUEST
    ),
    map(() => {
      const tracks = r.getSubtitlesTracks(state$.value)
      if (!tracks.length)
        return r.simpleMessageSnackbar(
          'Please add a subtitles track and try again.'
        )
      const mediaFile = r.getCurrentMediaMetadata(state$.value)
      if (!mediaFile || !r.getCurrentFilePath(state$.value))
        return r.simpleMessageSnackbar(
          'Please locate this media file and try again.'
        )
      if (!r.getCurrentFileClips(state$.value).length)
        return r.subtitlesClipDialog()
      return r.confirmationDialog(
        'This action will delete any clips and cards you made for this current file. Are you sure you want to continue?',
        r.subtitlesClipDialog()
      )
    })
  )

const goToSubtitlesChunk: Epic<Action, any, AppState, EpicsDependencies> = (
  action$,
  state$,
  { setCurrentTime }
) =>
  action$.pipe(
    ofType<Action, GoToSubtitlesChunk>(A.GO_TO_SUBTITLES_CHUNK),
    map(({ chunkIndex, subtitlesTrackId }) => {
      const track = r.getSubtitlesTrack(state$.value, subtitlesTrackId)
      if (!track) {
        console.error('Track not found')
        return { type: 'Subtitles track not found' }
      }
      const { start } = track.chunks[chunkIndex]
      setCurrentTime(r.getSecondsAtX(state$.value, start))
      return { type: 'moved to', start }
    })
  )

export default combineEpics(
  // loadEmbeddedSubtitles,
  // loadSubtitlesFile,
  // loadSubtitlesFailure,
  makeClipsFromSubtitles,
  subtitlesClipsDialogRequest,
  goToSubtitlesChunk
)
