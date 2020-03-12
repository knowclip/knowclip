import { join, basename } from 'path'
import { promises } from 'fs'
import clipAudio from '../utils/clipAudio'
import { getVideoStill } from '../utils/getVideoStill'
const { readFile } = promises

export type AnkiNote = {
  note: {
    fields: string[]
    guid: null
    tags: string
  }
  clozeNote: {
    fields: string[]
    guid: null
    tags: string
  } | null
  soundData: {
    data: () => Promise<Buffer>
    fileName: string
    filePath: string
  }
  imageData: {
    data: () => Promise<Buffer>
    fileName: string
    filePath: string
  } | null
}

export async function processClip(
  clipSpecs: ClipSpecs,
  directory: string
): AsyncResult<AnkiNote> {
  const {
    outputFilename,
    sourceFilePath,
    startTime,
    endTime,
    flashcardSpecs: { fields, tags, clozeDeletions, image },
  } = clipSpecs

  const note = { fields, guid: null, tags }
  // todo: try with knowclip id as second argument
  const clozeNote = clozeDeletions
    ? { fields: [clozeDeletions, ...fields.slice(1)], guid: null, tags }
    : null

  const clipOutputFilePath = join(directory, outputFilename)
  const clipAudioResult = await clipAudio(
    sourceFilePath,
    startTime,
    endTime,
    clipOutputFilePath
  )
  if (clipAudioResult.errors)
    return {
      errors: [
        `Could not make clip from ${sourceFilePath}`,
        ...clipAudioResult.errors,
      ],
    }
  const soundData = {
    data: () => readFile(clipOutputFilePath),
    fileName: outputFilename,
    filePath: clipOutputFilePath,
  }

  const imageResult = image
    ? await getVideoStill(image.id, sourceFilePath, image.seconds)
    : null
  if (imageResult && imageResult.errors)
    return {
      errors: [
        `Could not make clip from ${sourceFilePath}`,
        ...imageResult.errors,
      ],
    }

  const imageData = imageResult
    ? {
        data: () => readFile(imageResult.value),
        fileName: basename(imageResult.value),
        filePath: imageResult.value,
      }
    : null

  return {
    value: {
      note,
      clozeNote,
      soundData,
      imageData,
    },
  }
}
