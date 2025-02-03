export type DictionaryMediaFile = {
  dictionaryId: number
  type: string
  /** The path within the original dictionary zip archive,
   * used e.g. in terms to reference this file */
  path: string
  /** e.g. for an image, JSON with the width and height. */
  metadata: any
  /** The actual file data */
  content: ArrayBuffer
}
