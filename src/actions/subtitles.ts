export const showSubtitles = (
  id: SubtitlesTrackId,
  mediaFileId: MediaFileId
): ShowSubtitles => ({
  type: A.SHOW_SUBTITLES,
  id,
  mediaFileId,
})

export const hideSubtitles = (
  id: SubtitlesTrackId,
  mediaFileId: MediaFileId
): HideSubtitles => ({
  type: A.HIDE_SUBTITLES,
  id,
  mediaFileId,
})

export const loadSubtitlesFromFileRequest = (
  filePath: string,
  mediaFileId: MediaFileId
): LoadSubtitlesFromFileRequest => ({
  type: A.LOAD_SUBTITLES_FROM_FILE_REQUEST,
  filePath,
  mediaFileId,
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

export const deleteSubtitlesTrack = (
  id: SubtitlesTrackId,
  mediaFileId: MediaFileId
): DeleteSubtitlesTrack => ({
  type: A.DELETE_SUBTITLES_TRACK,
  id,
  mediaFileId,
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

export const subtitlesClipsDialogRequest = (): ShowSubtitlesClipsDialogRequest => ({
  type: A.SHOW_SUBTITLES_CLIPS_DIALOG_REQUEST,
})

export const linkFlashcardFieldToSubtitlesTrack = (
  flashcardFieldName: FlashcardFieldName,
  mediaFileId: MediaFileId,
  subtitlesTrackId: SubtitlesTrackId | null
): LinkFlashcardFieldToSubtitlesTrack => ({
  type: A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK,
  flashcardFieldName,
  mediaFileId,
  subtitlesTrackId,
})

export const goToSubtitlesChunk = (
  subtitlesTrackId: SubtitlesTrackId,
  chunkIndex: number
): GoToSubtitlesChunk => ({
  type: A.GO_TO_SUBTITLES_CHUNK,
  subtitlesTrackId,
  chunkIndex,
})
