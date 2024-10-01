import * as tempy from 'tempy'
import { readFile, writeFile } from 'fs/promises'
import {
  getMediaMetadata,
  writeMediaSubtitlesToVtt,
  convertAssToVtt,
} from './ffmpeg'
import r from '../redux'
import { extname, basename, join } from 'path'
import { parseSync, stringifySync } from 'subtitle'
import { parse as subsrtParse } from '@silvestre/subsrt'
import { readVttChunk } from '../selectors/subtitles'
import { failure } from '../utils/result'

export const getSubtitlesFilePathFromMedia = async (
  file: SubtitlesFile,
  mediaFilePath: MediaFilePath,
  streamIndex: number
): AsyncResult<string> => {
  const result = await getMediaMetadata(mediaFilePath)
  if (result.error) {
    console.error(`Error getting media metadata for ${mediaFilePath}`)
    return result
  }
  const { value: mediaMetadata } = result
  if (
    !mediaMetadata.streams[streamIndex] ||
    mediaMetadata.streams[streamIndex].codec_type !== 'subtitle'
  ) {
    return failure(
      `Stream index ${streamIndex} is not a subtitle stream in ${mediaFilePath}`
    )
  }

  const outputFilePath = join(
    tempy.rootTemporaryDirectory,
    basename(mediaFilePath + '_' + streamIndex.toString()) +
      '_' +
      file.id +
      '.vtt'
  )

  const vttResult = await writeMediaSubtitlesToVtt(
    mediaFilePath,
    streamIndex,
    outputFilePath
  )
  if (vttResult.error) {
    console.error(
      `Error writing media subtitles to VTT at stream index ${streamIndex}: ${vttResult.error}`
    )
  }
  return vttResult
}

export const getExternalSubtitlesVttPath = async (
  state: AppState,
  file: SubtitlesFile,
  filePath: string
): AsyncResult<string> => {
  try {
    const extension = extname(filePath).toLowerCase()

    const vttFilePath =
      extension === '.vtt'
        ? filePath
        : join(
            tempy.rootTemporaryDirectory,
            basename(filePath) + '_' + file.id + '.vtt'
          )

    const fileContents = await readFile(filePath, 'utf8')
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
    return { value: vttFilePath }
  } catch (error) {
    console.error(error)
    return failure(error)
  }
}

export const getSubtitlesFilePath = async (
  state: AppState,
  sourceFilePath: string,
  file: ExternalSubtitlesFile | VttConvertedSubtitlesFile
): AsyncResult<string> => {
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
      return subsrtParse(fileContents)
        .filter(({ type }) => type === 'caption')
        .map((chunk, index) => r.readSubsrtChunk({ ...chunk, index }))
    case '.vtt':
    case '.srt':
      return parseSync(fileContents).flatMap(
        ({ data: vttChunk }, index) =>
          typeof vttChunk === 'string'
            ? []
            : readVttChunk({
                start: Number(vttChunk.start),
                end: Number(vttChunk.end),
                text: vttChunk.text,
                index,
              }) // TODO: handle failed number parse
      )
    default:
      throw new Error('Unknown subtitles format')
  }
}

export const getSubtitlesFromFile = async (
  state: AppState,
  sourceFilePath: string
): AsyncResult<SubtitlesChunk[]> => {
  try {
    const extension = extname(sourceFilePath).toLowerCase()
    const fileContents = await readFile(sourceFilePath, 'utf-8')
    return { value: parseSubtitles(state, fileContents, extension) }
  } catch (error) {
    return failure(error)
  }
}

export const validateSubtitleFileBeforeOpen = async <S extends SubtitlesFile>(
  state: AppState,
  sourceFilePath: string,
  existingFile: S
): AsyncResult<
  | {
      type: 'no issues'
      file: S
    }
  | {
      type: 'changes detected'
      file: S
      result: {
        differences: { attribute: string; name: string }[]
        warningMessage: string
      }
    }
> => {
  const validation = await validateSubtitlesFromFilePath(
    state,
    sourceFilePath,
    existingFile
  )

  if (validation.error) {
    return failure(validation.error)
  }

  const newChunksMetadata = validation.value?.newChunksMetadata
  const file: S = newChunksMetadata
    ? {
        ...existingFile,
        ...newChunksMetadata,
      }
    : existingFile

  if (validation.value?.differences)
    return {
      value: {
        type: 'changes detected' as const,
        file,
        result: validation.value,
      },
    }

  return {
    value: {
      type: 'no issues' as const,
      file,
    },
  }
}

export const validateSubtitlesFromFilePath = async (
  state: AppState,
  sourceFilePath: string,
  existingFile: SubtitlesFile
): AsyncResult<
  | {
      differences: { attribute: string; name: string }[]
      newChunksMetadata: SubtitlesChunksMetadata | null
      warningMessage: string
    }
  | {
      newChunksMetadata: SubtitlesChunksMetadata | null
      differences?: undefined
    }
> => {
  try {
    const differences: { attribute: string; name: string }[] = []

    const extension = extname(sourceFilePath).toLowerCase()
    const fileContents = await readFile(sourceFilePath, 'utf8')
    const parsed = parseSubtitles(state, fileContents, extension)

    const { chunksMetadata } = existingFile

    const endChunk = parsed[parsed.length - 1]
    const endCue = endChunk ? endChunk.end : null
    const newChunksMetadata: SubtitlesChunksMetadata | null =
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
          value: {
            differences,
            newChunksMetadata,
            warningMessage: `This ${
              'name' in existingFile
                ? `subtitles file "${existingFile.name}"`
                : `embedded subtitles track`
            } differs from the one on record by:\n\n ${differences
              .map(({ name }) => name)
              .join(
                '\n'
              )}. \n\nAre you sure this is the file you want to open?`,
          },
        }
      }
    }
    return { value: { newChunksMetadata } }
  } catch (error) {
    return failure(error)
  }
}
