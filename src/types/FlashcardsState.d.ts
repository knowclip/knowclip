declare type FlashcardsState = Record<ClipId, Flashcard>

declare type ClozeDeletion = {
  clozeId: ClozeId
  ranges: { start: number; end: number }[]
}
