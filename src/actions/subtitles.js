// @flow
export const showSubtitles = (id: SubtitlesTrackId): SubtitlesAction => ({
  type: 'SHOW_SUBTITLES',
  id,
})

export const hideSubtitles = (id: SubtitlesTrackId): SubtitlesAction => ({
  type: 'HIDE_SUBTITLES',
  id,
})

export const loadSubtitlesFromFileRequest = (
  filePath: string
): SubtitlesAction => ({
  type: 'LOAD_SUBTITLES_FROM_FILE_REQUEST',
  filePath,
})

export const loadEmbeddedSubtitlesSuccess = (
  subtitlesTracks: Array<EmbeddedSubtitlesTrack>
): LoadEmbeddedSubtitlesSuccess => ({
  type: 'LOAD_EMBEDDED_SUBTITLES_SUCCESS',
  subtitlesTracks,
})

export const loadExternalSubtitlesSuccess = (
  subtitlesTracks: Array<ExternalSubtitlesTrack>
): LoadExternalSubtitlesSuccess => ({
  type: 'LOAD_EXTERNAL_SUBTITLES_SUCCESS',
  subtitlesTracks,
})

export const loadSubtitlesFailure = (error: string): LoadSubtitlesFailure => ({
  type: 'LOAD_SUBTITLES_FAILURE',
  error,
})

export const deleteSubtitlesTrack = (
  id: SubtitlesTrackId
): SubtitlesAction => ({
  type: 'DELETE_SUBTITLES_TRACK',
  id,
})

export const makeClipsFromSubtitles = (
  fileId: MediaFileId,
  fieldNamesToTrackIds: { [FlashcardFieldName]: SubtitlesTrackId },
  tags: Array<string>
): SubtitlesAction => ({
  type: 'MAKE_CLIPS_FROM_SUBTITLES',
  fileId,
  fieldNamesToTrackIds,
  tags,
})

export const subtitlesClipsDialogRequest = (): SubtitlesAction => ({
  type: 'SHOW_SUBTITLES_CLIPS_DIALOG_REQUEST',
})

export const linkFlashcardFieldToSubtitlesTrack = (
  flashcardFieldName: FlashcardFieldName,
  subtitlesTrackId: SubtitlesTrackId
) => ({
  type: 'LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK',
  flashcardFieldName,
  subtitlesTrackId,
})

export const goToSubtitlesChunk = (
  subtitlesTrackId: SubtitlesTrackId,
  chunkIndex: number
): SubtitlesAction => ({
  type: 'GO_TO_SUBTITLES_CHUNK',
  subtitlesTrackId,
  chunkIndex,
})
