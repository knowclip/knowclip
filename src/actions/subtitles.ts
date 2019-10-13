export const showSubtitles = (id: SubtitlesTrackId) => ({
  type: A.SHOW_SUBTITLES,
  id,
})

export const hideSubtitles = (id: SubtitlesTrackId) => ({
  type: A.HIDE_SUBTITLES,
  id,
})

export const loadSubtitlesFromFileRequest = (filePath: string) => ({
  type: A.LOAD_SUBTITLES_FROM_FILE_REQUEST,
  filePath,
})

export const loadEmbeddedSubtitlesSuccess = (
  subtitlesTracks: Array<EmbeddedSubtitlesTrack>,
  mediaFileId: MediaFileId
): LoadEmbeddedSubtitlesSuccess => ({
  type: A.LOAD_EMBEDDED_SUBTITLES_SUCCESS,
  subtitlesTracks,
  mediaFileId,
})

export const loadExternalSubtitlesSuccess = (
  subtitlesTracks: Array<ExternalSubtitlesTrack>,
  mediaFileId: MediaFileId
): LoadExternalSubtitlesSuccess => ({
  type: A.LOAD_EXTERNAL_SUBTITLES_SUCCESS,
  subtitlesTracks,
  mediaFileId,
})

export const loadSubtitlesFailure = (error: string): LoadSubtitlesFailure => ({
  type: A.LOAD_SUBTITLES_FAILURE,
  error,
})

export const deleteSubtitlesTrack = (id: SubtitlesTrackId) => ({
  type: A.DELETE_SUBTITLES_TRACK,
  id,
})

export const makeClipsFromSubtitles = (
  fileId: MediaFileId,
  fieldNamesToTrackIds: Record<FlashcardFieldName, SubtitlesTrackId>,
  tags: Array<string>
): MakeClipsFromSubtitles => ({
  type: A.MAKE_CLIPS_FROM_SUBTITLES,
  fileId,
  fieldNamesToTrackIds,
  tags,
})

export const subtitlesClipsDialogRequest = () => ({
  type: A.SHOW_SUBTITLES_CLIPS_DIALOG_REQUEST,
})

export const linkFlashcardFieldToSubtitlesTrack = (
  flashcardFieldName: FlashcardFieldName,
  subtitlesTrackId: SubtitlesTrackId
): LinkFlashcardFieldToSubtitlesTrack => ({
  type: A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK,
  flashcardFieldName,
  subtitlesTrackId,
})

export const goToSubtitlesChunk = (
  subtitlesTrackId: SubtitlesTrackId,
  chunkIndex: number
) => ({
  type: A.GO_TO_SUBTITLES_CHUNK,
  subtitlesTrackId,
  chunkIndex,
})
