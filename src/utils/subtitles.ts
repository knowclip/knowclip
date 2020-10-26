import tempy from 'tempy'
import { promises } from 'fs'
import ffmpeg, { getMediaMetadata } from '../utils/ffmpeg'
import * as r from '../redux'
import { extname, basename, join } from 'path'
import { parse, stringifyVtt } from 'subtitle'
import subsrt from 'subsrt'
import { getMillisecondsAtX } from '../selectors'

const { readFile, writeFile } = promises

export const getSubtitlesFilePathFromMedia = async (
  file: SubtitlesFile,
  mediaFilePath: MediaFilePath,
  streamIndex: number
): Promise<string | null> => {
  const result = await getMediaMetadata(mediaFilePath)
  if (result.errors) {
    console.error(result.errors)
    return null
  }
  const { value: mediaMetadata } = result
  if (
    !mediaMetadata.streams[streamIndex] ||
    mediaMetadata.streams[streamIndex].codec_type !== 'subtitle'
  ) {
    return null
  }
  const outputFilePath = join(
    tempy.root,
    basename(mediaFilePath + '_' + streamIndex.toString()) +
      '_' +
      file.id +
      '.vtt'
  )

  return await new Promise((res, rej) =>
    ffmpeg(mediaFilePath)
      .outputOptions(`-map 0:${streamIndex}`)
      .output(outputFilePath)
      .on('end', () => {
        res(outputFilePath)
      })
      .on('error', (err) => {
        console.error(err)
        rej(err)
      })
      .run()
  )
}

export const getExternalSubtitlesVttPath = async (
  state: AppState,
  file: SubtitlesFile,
  filePath: string
) => {
  const extension = extname(filePath).toLowerCase()

  const vttFilePath =
    extension === '.vtt'
      ? filePath
      : join(tempy.root, basename(filePath) + '_' + file.id + '.vtt')

  const fileContents = await readFile(filePath, 'utf8')
  const chunks = parseSubtitles(state, fileContents, extension)

  if (extension === '.ass') await convertAssToVtt(filePath, vttFilePath)
  if (extension === '.srt')
    await writeFile(
      vttFilePath,
      stringifyVtt(
        chunks.map((chunk) => ({
          start: Math.round(getMillisecondsAtX(state, chunk.start)),
          end: Math.round(getMillisecondsAtX(state, chunk.end)),
          text: chunk.text,
        }))
      ),
      'utf8'
    )
  return vttFilePath
}

export const getSubtitlesFilePath = async (
  state: AppState,
  sourceFilePath: string,
  file: ExternalSubtitlesFile | VttConvertedSubtitlesFile
) => {
  if (file.type === 'ExternalSubtitlesFile') {
    return await getExternalSubtitlesVttPath(state, file, sourceFilePath)
  }
  switch (file.parentType) {
    case 'ExternalSubtitlesFile':
      return await getExternalSubtitlesVttPath(state, file, sourceFilePath)
    case 'MediaFile':
      const subtitlesFilePath = await getSubtitlesFilePathFromMedia(
        file,
        sourceFilePath,
        file.streamIndex
      )
      if (!subtitlesFilePath) {
        throw new Error('There was a problem loading embedded subtitles')
      }
      return subtitlesFilePath
  }
}

export const convertAssToVtt = (filePath: string, vttFilePath: string) =>
  new Promise((res, rej) =>
    ffmpeg(filePath)
      .output(vttFilePath)
      .on('end', () => {
        res(vttFilePath)
      })
      .on('error', (err) => {
        console.error(err)
        rej(err)
      })
      .run()
  )

const parseSubtitles = (
  state: AppState,
  fileContents: string,
  extension: string
) => {
  switch (extension) {
    case '.ass':
      return sanitizeSubtitles(
        subsrt
          .parse(fileContents)
          .filter(({ type }) => type === 'caption')
          .map((chunk) => r.readSubsrtChunk(state, chunk))
      )
    case '.vtt':
    case '.srt':
      return sanitizeSubtitles(
        parse(fileContents).map((vttChunk) =>
          r.readVttChunk(state, vttChunk as SubtitlesChunk)
        )
      )
    default:
      throw new Error('Unknown subtitles format')
  }
}

/** mutates */
export const sanitizeSubtitles = (
  chunks: SubtitlesChunk[]
): SubtitlesChunk[] => {
  const result = []
  let lastChunk: SubtitlesChunk | undefined
  for (const chunk of chunks) {
    if (lastChunk && lastChunk.end === chunk.start) lastChunk.end -= 1

    if (chunk.text.trim()) {
      result.push(chunk)
      lastChunk = chunk
    }
  }
  return result
}

export const getSubtitlesFromFile = async (
  state: AppState,
  sourceFilePath: string
) => {
  try {
    const extension = extname(sourceFilePath).toLowerCase()
    const fileContents = await readFile(sourceFilePath, 'utf8')
    return parseSubtitles(state, fileContents, extension)
  } catch (error) {
    return { error }
  }
}

export const validateBeforeOpenFileAction = async <S extends SubtitlesFile>(
  state: AppState,
  sourceFilePath: string,
  existingFile: S
) => {
  const validation = await validateSubtitlesFromFilePath(
    state,
    sourceFilePath,
    existingFile
  )

  const newChunksMetadata = validation.newChunksMetadata
    ? { chunksMetadata: validation.newChunksMetadata }
    : null
  const file: S = newChunksMetadata
    ? {
        ...existingFile,
        ...newChunksMetadata,
      }
    : existingFile
  if (validation.valid) {
    return [r.openFileSuccess(file, sourceFilePath)]
  }

  if (validation.differences)
    // better "changes?"
    return [
      r.confirmationDialog(
        validation.message,
        r.openFileSuccess(file, sourceFilePath),
        r.openFileFailure(
          existingFile,
          sourceFilePath,
          `Some features may be unavailable until your file is located.`
        ),
        true
      ),
    ]

  return [r.openFileFailure(existingFile, sourceFilePath, validation.error)]
}

export const validateSubtitlesFromFilePath = async (
  state: AppState,
  sourceFilePath: string,
  existingFile: SubtitlesFile
) => {
  try {
    const differences: { attribute: string; name: string }[] = []

    const extension = extname(sourceFilePath).toLowerCase()
    const fileContents = await readFile(sourceFilePath, 'utf8')
    const parsed = parseSubtitles(state, fileContents, extension)

    const { chunksMetadata } = existingFile

    const endChunk = parsed[parsed.length - 1]
    const endCue = endChunk ? endChunk.end : null
    const newChunksMetadata =
      parsed.length && typeof endCue === 'number'
        ? {
            count: parsed.length,
            endCue: endCue,
          }
        : null

    if (chunksMetadata) {
      if (chunksMetadata.count !== parsed.length)
        differences.push({ attribute: 'count', name: 'number of cues' })

      if (chunksMetadata.endCue !== endCue)
        differences.push({ attribute: 'endCue', name: 'timing' })

      if (differences.length)
        return {
          differences,
          newChunksMetadata,
          message: `This ${
            'name' in existingFile
              ? `subtitles file "${existingFile.name}"`
              : `embedded subtitles track`
          } differs from the one on record by:\n\n ${differences
            .map(({ name }) => name)
            .join('\n')}. \n\nAre you sure this is the file you want to open?`,
        }
    }
    return { valid: true, newChunksMetadata }
  } catch (error) {
    return { error }
  }
}

export const newEmbeddedSubtitlesTrack = (
  id: string,
  chunks: Array<SubtitlesChunk>
): EmbeddedSubtitlesTrack => ({
  type: 'EmbeddedSubtitlesTrack',
  id,
  mode: 'hidden',
  chunks,
})

export const newExternalSubtitlesTrack = (
  id: string,
  chunks: Array<SubtitlesChunk>
): ExternalSubtitlesTrack => ({
  mode: 'hidden',
  type: 'ExternalSubtitlesTrack',
  id,
  chunks,
})
