import { promisify } from 'util'
import tempy from 'tempy'
import fs from 'fs'
// import parseSRT from 'parse-srt'
import ffmpeg, { getMediaMetadata } from '../utils/ffmpeg'
import srtParser from 'subtitles-parser'
import { ofType, combineEpics } from 'redux-observable'
import { filter, flatMap, map } from 'rxjs/operators'
import uuid from 'uuid/v4'
import * as r from '../redux'
import { extname } from 'path'
import ass2vtt from 'ass-to-vtt'
import { parse, stringifyVtt } from 'subtitle'
import subsrt from 'subsrt'
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

export const getSubtitlesFilePathFromMedia = async (
  mediaFilePath,
  streamIndex
) => {
  const mediaMetadata = await getMediaMetadata(mediaFilePath)
  console.log('got metadata', mediaMetadata)
  console.log('streamindex', streamIndex)
  if (
    !mediaMetadata.streams[streamIndex] ||
    mediaMetadata.streams[streamIndex].codec_type !== 'subtitle'
  ) {
    console.log(
      'falsdfjlaksdjflkasdjflkasjdflajsdlfjaslkdfjalskdjflaskjdflkasjdflkasjfdlkj'
    )
    return null
  }
  //   const subtitlesFormat = mediaMetadata.streams[streamIndex].codec_name
  // const outputFilePath = tempy.file({ extension: 'vtt' })
  const outputFilePath = tempy.file({ extension: 'vtt' })

  return await new Promise((res, rej) =>
    ffmpeg(mediaFilePath)
      .outputOptions(`-map 0:${streamIndex}`)
      .output(outputFilePath)
      .on('end', () => {
        console.log('DONE!!')
        res(outputFilePath)
      })
      .on('error', err => {
        console.error('error')
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
    console.log(
      'asldfjalskdfjaslkdjf;lasdjf;lkasjdf;lajsd;flkjas;ldfkjas;ldfkjas;lfkj;'
    )
    return []
  }
  const vttText = await readFile(subtitlesFilePath, 'utf8')
  console.log(vttText)

  return {
    tmpFilePath: subtitlesFilePath,
    chunks: parse(vttText).map(vttChunk => r.readVttChunk(state, vttChunk)),
  }
}

export const convertAssToVtt = (filePath, vttFilePath) =>
  new Promise((res, rej) =>
    ffmpeg(filePath)
      // .outputOptions(`-map 0:${streamIndex}`)
      .output(vttFilePath)
      .on('end', () => {
        console.log('DONE!!')
        res(vttFilePath)
      })
      .on('error', err => {
        console.error('error')
        rej(err)
      })
      .run()
  )

// new Promise((res, rej) => {
//   fs.createReadStream(filePath)
//     .pipe(ass2vtt())
//     .pipe(fs.createWriteStream(vttFilePath))
//     .on('end', () => res(vttFilePath))
//     .on('error', err => {
//       console.error(err)
//       rej(err)
//     })
// })

const parseSubtitles = (state, fileContents, extension) =>
  extension === '.ass'
    ? subsrt
        .parse(fileContents)
        .filter(({ type }) => type === 'caption')
        .map(chunk => r.readSubsrtChunk(state, chunk))
    : parse(fileContents).map(vttChunk => r.readVttChunk(state, vttChunk))

export const getSubtitlesFromFile = async (filePath, state) => {
  const extension = extname(filePath).toLowerCase()
  const vttFilePath =
    extension === '.vtt' ? filePath : tempy.file({ extension: 'vtt' })
  const fileContents = await readFile(filePath, 'utf8')
  // can be secs or ms depnding on type, fix this!!!
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

export default combineEpics(
  loadEmbeddedSubtitles,
  loadSubtitlesFile,
  loadSubtitlesFailure
)
