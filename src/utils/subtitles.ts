import { promisify } from 'util'
import tempy from 'tempy'
import fs from 'fs'
import ffmpeg, { getMediaMetadata } from '../utils/ffmpeg'
import * as r from '../redux'
import { extname } from 'path'
import { parse, stringifyVtt } from 'subtitle'
import subsrt from 'subsrt'
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
