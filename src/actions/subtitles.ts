import A from '../types/ActionType'
import { basename } from 'path'
import { filesActions } from './files'
import { uuid } from '../utils/sideEffects'
import { TransliterationFlashcardFields } from '../types/Project'

const openFileRequest = filesActions.openFileRequest

export const subtitlesActions = {
  [A.showSubtitles]: (id: SubtitlesTrackId) => ({
    type: A.showSubtitles,
    id,
  }),
  [A.hideSubtitles]: (id: SubtitlesTrackId) => ({
    type: A.hideSubtitles,
    id,
  }),
  [A.mountSubtitlesTrack]: (track: SubtitlesTrack) => ({
    type: A.mountSubtitlesTrack,
    track,
  }),

  [A.makeClipsFromSubtitles]: (
    fileId: MediaFileId,
    fieldNamesToTrackIds: Partial<TransliterationFlashcardFields>,
    tags: Array<string>,
    includeStill: boolean
  ) => ({
    type: A.makeClipsFromSubtitles,
    fileId,
    fieldNamesToTrackIds,
    tags,
    includeStill,
  }),
  [A.showSubtitlesClipsDialogRequest]: () => ({
    type: A.showSubtitlesClipsDialogRequest,
  }),
  [A.linkFlashcardFieldToSubtitlesTrackRequest]: (
    flashcardFieldName: FlashcardFieldName,
    mediaFileId: MediaFileId,
    subtitlesTrackId: SubtitlesTrackId | null
  ) => ({
    type: A.linkFlashcardFieldToSubtitlesTrackRequest,
    flashcardFieldName,
    mediaFileId,
    subtitlesTrackId,
  }),
  [A.goToSubtitlesChunk]: (
    subtitlesTrackId: SubtitlesTrackId,
    chunkIndex: number
  ) => ({
    type: A.goToSubtitlesChunk,
    subtitlesTrackId,
    chunkIndex,
  }),
}

const addSubtitlesTrack = (track: SubtitlesTrack, mediaFileId: MediaFileId) =>
  filesActions.updateFile({
    fileType: 'MediaFile',
    updateName: 'addSubtitlesTrack',
    id: mediaFileId,
    updatePayload: [track],
  })

const loadNewSubtitlesFile = (filePath: string, mediaFileId: MediaFileId) =>
  openFileRequest(
    {
      type: 'ExternalSubtitlesFile',
      parentId: mediaFileId,
      id: uuid(),
      name: basename(filePath),
      chunksMetadata: null,
    },
    filePath
  )

const deleteSubtitlesTrackFromMedia = (
  id: SubtitlesTrackId,
  mediaFileId: MediaFileId
) =>
  filesActions.updateFile({
    fileType: 'MediaFile',
    updateName: 'deleteSubtitlesTrack',
    id: mediaFileId,
    updatePayload: [id],
  })

const linkFlashcardFieldToSubtitlesTrack = (
  flashcardFieldName: FlashcardFieldName,
  mediaFileId: MediaFileId,
  subtitlesTrackId: SubtitlesTrackId | null,
  fieldToClear?: FlashcardFieldName
) =>
  filesActions.updateFile({
    // ): UpdateFileWith<'linkFlashcardFieldToSubtitlesTrack'> => filesActions.updateFile({
    fileType: 'MediaFile',
    updateName: 'linkFlashcardFieldToSubtitlesTrack',
    id: mediaFileId,
    updatePayload: [flashcardFieldName, subtitlesTrackId, fieldToClear || null],
  })

export const compositeSubtitlesActions = {
  addSubtitlesTrack,
  loadNewSubtitlesFile,
  deleteSubtitlesTrackFromMedia,
  linkFlashcardFieldToSubtitlesTrack,
}

// type X = MediaFile extends FileMetadata ? string : number
