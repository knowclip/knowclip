export type AnkiNoteMedia = {
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

export function getClozeFields(fields: string[], clozeDeletions: string) {
  return [clozeDeletions, ...fields.slice(1)]
}
