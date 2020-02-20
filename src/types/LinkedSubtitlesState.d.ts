// declare type LinkedSubtitlesState = {
//   trackIds: SubtitlesTrackId[]
//   // mediaFileId: MediaFileId
//   chunks: Array<{
//     start: number
//     end: number
//     fields: Dict<TransliterationFlashcardFieldName, SubtitlesChunkIndex[]>
//   }>
// }

type SubtitlesChunkIndex = number

declare type LinkedSubtitlesState =
  | {
      cuesBase: null
      chunks: []
    }
  | {
      // mediaFileId: MediaFileId
      cuesBase: SubtitlesTrackId
      chunks: Array<Dict<SubtitlesTrackId, SubtitlesChunkIndex[]>>
    }
