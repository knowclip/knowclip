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

export const loadSubtitlesSuccess = (
  subtitlesTracks: Array<SubtitlesTrack>
) => ({
  type: 'LOAD_SUBTITLES_SUCCESS',
  subtitlesTracks,
})

export const newEmbeddedSubtitlesTrack = (
  id: string,
  chunks: Array<SubtitlesChunk>,
  streamIndex: number,
  tmpFilePath: string
): EmbeddedSubtitlesTrack => ({
  type: 'EmbeddedSubtitlesTrack',
  id,
  mode: 'showing',
  chunks,
  streamIndex,
  tmpFilePath,
})

export const newExternalSubtitlesTrack = (
  id: string,
  chunks: Array<SubtitlesChunk>,
  filePath: SubtitlesFilePath,
  vttFilePath: SubtitlesFilePath
): ExternalSubtitlesTrack => ({
  mode: 'showing',
  type: 'ExternalSubtitlesTrack',
  id,
  chunks,
  filePath,
  vttFilePath,
})

// export const loadEmbeddedSubtitlesSuccess = (

// ): SubtitlesAction =>
//   loadSubtitlesSuccess([
//     {
//       type: 'EmbeddedSubtitlesTrack',
//       id,
//       mode: 'showing',
//       chunks,
//       streamIndex,
//       tmpFilePath,
//     },
//   ])

export const loadSubtitlesFailure = (error: string): SubtitlesAction => ({
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
