import { join, basename } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { clipAudio } from './clipAudio'
import { getVideoStill } from './getVideoStill'
import { AnkiNoteMedia } from '../utils/ankiNote'
import { failure } from '../utils/result'

export async function getClipMedia(
  clipSpecs: ClipSpecs,
  destinationFolder: string,
  // TODO: check if redundant
  saveImages?: string
): AsyncResult<AnkiNoteMedia> {
  const {
    outputFilename,
    sourceFilePath,
    startTime,
    endTime,
    flashcardSpecs: { image },
  } = clipSpecs

  const clipOutputFilePath = join(destinationFolder, outputFilename)
  const clipAudioResult = await clipAudio(
    sourceFilePath,
    startTime,
    endTime,
    clipOutputFilePath
  )
  if (clipAudioResult.error)
    return failure(
      `Could not make clip from ${sourceFilePath}: ${clipAudioResult.error}`
    )

  const soundData = {
    data: () => readFile(clipOutputFilePath),
    fileName: outputFilename,
    filePath: clipOutputFilePath,
  }

  const imageResult = image
    ? await getVideoStill(image.id, sourceFilePath, image.seconds)
    : null
  if (imageResult && imageResult.error)
    return failure(
      `Could not make still from ${sourceFilePath}: ${imageResult.error}`
    )

  const imageData = imageResult
    ? {
        data: () => readFile(imageResult.value),
        fileName: basename(imageResult.value),
        filePath: imageResult.value,
      }
    : null

  if (imageData && saveImages)
    writeFile(
      join(destinationFolder, basename(imageData.filePath)),
      await imageData.data()
    )

  return {
    value: {
      soundData,
      imageData,
    },
  }
}
