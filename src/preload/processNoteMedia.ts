import { join, basename } from 'path'
import { promises } from 'fs'
import clipAudio from '../utils/clipAudio'
import { getVideoStill } from '../utils/getVideoStill'
import { AnkiNoteMedia } from '../utils/ankiNote'
const { readFile } = promises

export async function processNoteMedia(
  clipSpecs: ClipSpecs,
  directory: string
): AsyncResult<AnkiNoteMedia> {
  const {
    outputFilename,
    sourceFilePath,
    startTime,
    endTime,
    flashcardSpecs: { image },
  } = clipSpecs

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
        `Could not make still from ${sourceFilePath}`,
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
      soundData,
      imageData,
    },
  }
}
