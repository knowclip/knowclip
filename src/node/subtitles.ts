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

  return await writeMediaSubtitlesToVtt(
    mediaFilePath,
    streamIndex,
    outputFilePath
  )
}

export const getExternalSubtitlesVttPath = async (
  file: ExternalSubtitlesFile | VttConvertedSubtitlesFile,
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
    const chunksResult = parseSubtitles(fileContents, extension)
    if (chunksResult.error) return chunksResult
    const { value: chunks } = chunksResult

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
    return await getExternalSubtitlesVttPath(file, sourceFilePath)
  }
  switch (file.parentType) {
    case 'ExternalSubtitlesFile':
      return await getExternalSubtitlesVttPath(file, sourceFilePath)
    case 'MediaFile': {
      return await getSubtitlesFilePathFromMedia(
        file,
        sourceFilePath,
        file.streamIndex
      )
    }
  }
}

const parseSubtitles = (
  fileContents: string,
  extension: string
): Result<SubtitlesChunk[]> => {
  try {
    switch (extension) {
      case '.ass':
        return {
          value: subsrtParse(fileContents)
            .filter(({ type }) => type === 'caption')
            .map((chunk, index) => r.readSubsrtChunk({ ...chunk, index })),
        }
      case '.vtt':
      case '.srt':
        return {
          value: parseSync(fileContents).flatMap(
            ({ data: vttChunk }, index) =>
              typeof vttChunk === 'string'
                ? []
                : readVttChunk({
                    start: Number(vttChunk.start),
                    end: Number(vttChunk.end),
                    text: vttChunk.text,
                    index,
                  }) // TODO: handle failed number parse
          ),
        }
      default:
        return failure(`Unknown subtitles format ${extension}`)
    }
  } catch (err) {
    return failure(err)
  }
}

export const getSubtitlesFromFile = async (
  sourceFilePath: string
): AsyncResult<SubtitlesChunk[]> => {
  try {
    console.log(`Getting subtitles from file ${sourceFilePath}`)
    const extension = extname(sourceFilePath).toLowerCase()
    const fileContents = await readFile(sourceFilePath, 'utf-8')
    return parseSubtitles(fileContents, extension)
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
    const parseResult = parseSubtitles(fileContents, extension)
    if (parseResult.error) return parseResult
    const { value: parsed } = parseResult

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
