import A from '../types/ActionType'
import { basename } from 'preloaded/path'
import { filesActions } from './files'
import { uuid } from '../utils/sideEffects'
import { TransliterationFlashcardFields } from '../types/Project'

const openFileRequest = filesActions.openFileRequest

export const subtitlesActions = {
  showSubtitles: (id: SubtitlesTrackId) => ({
    type: A.showSubtitles as const,
    id,
  }),
  hideSubtitles: (id: SubtitlesTrackId) => ({
    type: A.hideSubtitles as const,
    id,
  }),
  mountSubtitlesTrack: (track: SubtitlesTrack) => ({
    type: A.mountSubtitlesTrack as const,
    track,
  }),

  makeClipsFromSubtitles: (
    fileId: MediaFileId,
    fieldNamesToTrackIds: Partial<TransliterationFlashcardFields>,
    tags: Array<string>,
    includeStill: boolean
  ) => ({
    type: A.makeClipsFromSubtitles as const,
    fileId,
    fieldNamesToTrackIds,
    tags,
    includeStill,
  }),
  showSubtitlesClipsDialogRequest: () => ({
    type: A.showSubtitlesClipsDialogRequest as const,
  }),
  linkFlashcardFieldToSubtitlesTrackRequest: (
    flashcardFieldName: FlashcardFieldName,
    mediaFileId: MediaFileId,
    subtitlesTrackId: SubtitlesTrackId | null
  ) => ({
    type: A.linkFlashcardFieldToSubtitlesTrackRequest as const,
    flashcardFieldName,
    mediaFileId,
    subtitlesTrackId,
  }),
  goToSubtitlesChunk: (
    subtitlesTrackId: SubtitlesTrackId,
    chunkIndex: number
  ) => ({
    type: A.goToSubtitlesChunk as const,
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
