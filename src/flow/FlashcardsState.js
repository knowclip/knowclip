// @flow

declare type FlashcardId = ClipId
declare type Flashcard = Exact<{
  id: FlashcardId,
  de: string,
  en: string,
}>
declare type FlashcardsState = { [FlashcardId]: Flashcard }
