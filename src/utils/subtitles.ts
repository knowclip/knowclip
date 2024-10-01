import * as tempy from 'preloaded/tempy'
import { readFile, writeFile } from 'preloaded/fs'
import {
  getMediaMetadata,
  writeMediaSubtitlesToVtt,
  convertAssToVtt,
} from 'preloaded/ffmpeg'
import r from '../redux'
import { extname, basename, join } from 'preloaded/path'
import { parseSync, stringifySync } from 'preloaded/subtitle'
import { parse as subsrtParse } from 'preloaded/subsrt'

export const getSubtitlesFilePathFromMedia = async (
  file: SubtitlesFile,
  mediaFilePath: MediaFilePath,
  streamIndex: number
): Promise<string | null> => {
  const result = await getMediaMetadata(mediaFilePath)
  if (result.error) {
    console.error(`Error getting media metadata for ${mediaFilePath}`)
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
    tempy.rootTemporaryDirectory,
    basename(mediaFilePath + '_' + streamIndex.toString()) +
      '_' +
      file.id +
      '.vtt'
  )

  try {
    return await writeMediaSubtitlesToVtt(
      mediaFilePath,
      streamIndex,
      outputFilePath
    )
  } catch (error) {
    console.error(
      `Error writing media subtitles to VTT at stream index ${streamIndex}: ${error}`
    )
    return null
  }
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
      : join(
          tempy.rootTemporaryDirectory,
          basename(filePath) + '_' + file.id + '.vtt'
        )

  const fileContents = await readFile(filePath)
  const chunks = parseSubtitles(state, fileContents, extension)

  if (extension === '.ass') await convertAssToVtt(filePath, vttFilePath)
  if (extension === '.srt')
    await writeFile(
      vttFilePath,
      stringifySync(
        chunks.map((chunk) => ({
          type: 'cue',
          data: {
            start: Math.round(chunk.start),
            end: Math.round(chunk.end),
            text: chunk.text,
          },
        })),
        { format: 'WebVTT' }
      )
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
    case 'MediaFile': {
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
}

const parseSubtitles = (
  state: AppState,
  fileContents: string,
  extension: string
) => {
  switch (extension) {
    case '.ass':
      return sanitizeSubtitles(
        subsrtParse(fileContents)
          .filter(({ type }) => type === 'caption')
          .map((chunk, index) => r.readSubsrtChunk(state, { ...chunk, index }))
      )
    case '.vtt':
    case '.srt':
      return sanitizeSubtitles(
        parseSync(fileContents).flatMap(
          ({ data: vttChunk }, index) =>
            typeof vttChunk === 'string'
              ? []
              : r.readVttChunk(state, {
                  start: Number(vttChunk.start),
                  end: Number(vttChunk.end),
                  text: vttChunk.text,
                  index,
                }) // TODO: handle failed number parse
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
    const fileContents = await readFile(sourceFilePath)
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

  return [
    r.openFileFailure(existingFile, sourceFilePath, String(validation.error)),
  ]
}

export const validateSubtitlesFromFilePath = async (
  state: AppState,
  sourceFilePath: string,
  existingFile: SubtitlesFile
) => {
  try {
    const differences: { attribute: string; name: string }[] = []

    const extension = extname(sourceFilePath).toLowerCase()
    const fileContents = await readFile(sourceFilePath)
    const parsed = parseSubtitles(state, fileContents, extension)

    const { chunksMetadata } = existingFile

    const endChunk = parsed[parsed.length - 1]
    const endCue = endChunk ? endChunk.end : null
    const newChunksMetadata =
      parsed.length && typeof endCue === 'number'
        ? {
            count: parsed.length,
            endCueMs: endCue,
          }
        : null

    if (chunksMetadata) {
      if (chunksMetadata.count !== parsed.length)
        differences.push({ attribute: 'count', name: 'number of cues' })

      if (
        'endCue' in chunksMetadata
          ? chunksMetadata.endCue * 20 !== endCue
          : chunksMetadata.endCueMs !== endCue
      ) {
        differences.push({ attribute: 'endCue', name: 'timing' })
      }

      if (differences.length) {
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
