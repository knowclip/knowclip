import { promisify } from 'util'
import tempy from 'tempy'
import fs from 'fs'
import ffmpeg, { getMediaMetadata } from '../utils/ffmpeg'
import { ofType, combineEpics } from 'redux-observable'
import { filter, flatMap, map } from 'rxjs/operators'
import uuid from 'uuid/v4'
import * as r from '../redux'
import { extname } from 'path'
import { parse, stringifyVtt } from 'subtitle'
import subsrt from 'subsrt'
import newClip from '../utils/newClip'
import { getNoteTypeFields } from '../utils/noteType'
import { from } from 'rxjs'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

export const getSubtitlesFilePathFromMedia = async (
  mediaFilePath,
  streamIndex
) => {
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
  mediaFilePath,
  streamIndex,
  state
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
      .map(vttChunk => r.readVttChunk(state, vttChunk))
      .filter(({ text }) => text),
  }
}

export const convertAssToVtt = (filePath, vttFilePath) =>
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

const parseSubtitles = (state, fileContents, extension) =>
  extension === '.ass'
    ? subsrt
        .parse(fileContents)
        .filter(({ type }) => type === 'caption')
        .map(chunk => r.readSubsrtChunk(state, chunk))
        .filter(({ text }) => text)
    : parse(fileContents)
        .map(vttChunk => r.readVttChunk(state, vttChunk))
        .filter(({ text }) => text)

export const getSubtitlesFromFile = async (filePath, state) => {
  const extension = extname(filePath).toLowerCase()
  const vttFilePath =
    extension === '.vtt' ? filePath : tempy.file({ extension: 'vtt' })
  const fileContents = await readFile(filePath, 'utf8')
  const chunks = parseSubtitles(state, fileContents, extension)

  if (extension === '.ass') await convertAssToVtt(filePath, vttFilePath)
  if (extension === '.srt')
    await writeFile(vttFilePath, stringifyVtt(chunks), 'utf8')
  return {
    vttFilePath,
    chunks,
  }
}

export const loadEmbeddedSubtitles = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_SUCCESS'),
    filter(
      ({ subtitlesTracksStreamIndexes }) => subtitlesTracksStreamIndexes.length
    ),
    flatMap(async ({ subtitlesTracksStreamIndexes, filePath }) => {
      try {
        const subtitles = await Promise.all(
          subtitlesTracksStreamIndexes.map(async streamIndex => {
            const { tmpFilePath, chunks } = await getSubtitlesFromMedia(
              filePath,
              streamIndex,
              state$.value
            )
            return r.newEmbeddedSubtitlesTrack(
              uuid(),
              chunks,
              streamIndex,
              tmpFilePath
            )
          })
        )
        return r.loadSubtitlesSuccess(subtitles)
      } catch (err) {
        console.error(err)
        return r.loadSubtitlesFailure(err.message || err.toString())
      }
    })
  )

export const loadSubtitlesFailure = (action$, state$) =>
  action$.pipe(
    ofType('LOAD_SUBTITLES_FAILURE'),
    map(({ error }) =>
      r.simpleMessageSnackbar(`Could not load subtitles: ${error}`)
    )
  )

export const loadSubtitlesFile = (action$, state$) =>
  action$.pipe(
    ofType('LOAD_SUBTITLES_FROM_FILE_REQUEST'),
    flatMap(async ({ filePath }) => {
      try {
        const { chunks, vttFilePath } = await getSubtitlesFromFile(
          filePath,
          state$.value
        )

        return r.loadSubtitlesSuccess([
          r.newExternalSubtitlesTrack(uuid(), chunks, filePath, vttFilePath),
        ])
      } catch (err) {
        console.error(err.message)
        return r.loadSubtitlesFailure(err.message || err.toString())
      }
    })
  )

const makeClipsFromSubtitles = (action$, state$) =>
  action$.pipe(
    ofType('MAKE_CLIPS_FROM_SUBTITLES'),
    flatMap(({ fileId, fieldNamesToTrackIds, tags }) => {
      const transcriptionTrackId = fieldNamesToTrackIds.transcription
      const transcriptionTrack = r.getSubtitlesTrack(
        state$.value,
        transcriptionTrackId
      )
      if (!transcriptionTrack)
        return r.simpleMessageSnackbar(
          'Could not find subtitles track to match with transcription field.'
        )

      const currentNoteType = r.getCurrentNoteType(state$.value)
      const currentNoteTypeFields = getNoteTypeFields(currentNoteType)

      const clips = transcriptionTrack.chunks.map(chunk => {
        const fields = {
          transcription: chunk.text,
        }
        currentNoteTypeFields.forEach(fieldName => {
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
                .join('\n')
            : ''
        })

        return newClip(
          chunk,
          fileId,
          uuid(),
          r.getCurrentNoteType(state$.value),
          tags,
          fields
        )
      })

      return from([
        r.deleteCards(
          r.getClipIdsByMediaFileId(
            state$.value,
            r.getCurrentFileId(state$.value)
          )
        ),
        r.addClips(clips, fileId),
      ])
    })
  )

const subtitlesClipsDialogRequest = (action$, state$) =>
  action$.pipe(
    ofType('SHOW_SUBTITLES_CLIPS_DIALOG_REQUEST'),
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
      if (!r.getCurrentFileClips(state$.value)) return r.subtitlesClipDialog()
      return r.confirmationDialog(
        'This action will delete any clips and cards you made for this current file. Are you sure you want to continue?',
        r.subtitlesClipDialog()
      )
    })
  )

const goToSubtitlesChunk = (action$, state$) =>
  action$.pipe(
    ofType('GO_TO_SUBTITLES_CHUNK'),
    map(({ chunkIndex, subtitlesTrackId }) => {
      const track = r.getSubtitlesTrack(state$.value, subtitlesTrackId)
      if (!track) {
        console.error('Track not found')
        return { type: 'Subtitles track not found' }
      }
      const { start } = track.chunks[chunkIndex]
      document.getElementById('audioPlayer').currentTime = r.getSecondsAtX(
        state$.value,
        start
      )
      return { type: 'moved to', start }
    })
  )

export default combineEpics(
  loadEmbeddedSubtitles,
  loadSubtitlesFile,
  loadSubtitlesFailure,
  makeClipsFromSubtitles,
  subtitlesClipsDialogRequest,
  goToSubtitlesChunk
)
