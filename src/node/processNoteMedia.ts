import { getClipMedia } from './getClipMedia'

export async function processNoteMedia(
  clipSpecs: ClipSpecs,
  destinationFolder: string,
  // TODO: check if redundant
  saveImages?: string
): AsyncResult<'done'> {
  const clipMediaResult = await getClipMedia(
    clipSpecs,
    destinationFolder,
    saveImages
  )

  if (clipMediaResult.error) return clipMediaResult

  return {
    value: 'done',
  }
}
