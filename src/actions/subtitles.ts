import A from '../types/ActionType'
import { filesActions } from './files'
import { TransliterationFlashcardFields } from '../types/Project'
import { KnowclipActionCreatorsSubset } from '.'

export const subtitlesActions = {
  showSubtitles: (id: SubtitlesTrackId) => ({
    type: A.showSubtitles,
    id,
  }),
  hideSubtitles: (id: SubtitlesTrackId) => ({
    type: A.hideSubtitles,
    id,
  }),
  mountSubtitlesTrack: (track: SubtitlesTrack) => ({
    type: A.mountSubtitlesTrack,
    track,
  }),

  makeClipsFromSubtitles: (
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
  showSubtitlesClipsDialogRequest: () => ({
    type: A.showSubtitlesClipsDialogRequest,
  }),
  linkFlashcardFieldToSubtitlesTrackRequest: (
    flashcardFieldName: FlashcardFieldName,
    mediaFileId: MediaFileId,
    subtitlesTrackId: SubtitlesTrackId | null
  ) => ({
    type: A.linkFlashcardFieldToSubtitlesTrackRequest,
    flashcardFieldName,
    mediaFileId,
    subtitlesTrackId,
  }),
  goToSubtitlesChunk: (
    subtitlesTrackId: SubtitlesTrackId,
    chunkIndex: number
  ) => ({
    type: A.goToSubtitlesChunk,
    subtitlesTrackId,
    chunkIndex,
  }),
  loadNewSubtitlesFile: (filePath: string, mediaFileId: MediaFileId) => ({
    type: A.loadNewSubtitlesFile,
    filePath,
    mediaFileId,
  }),
} satisfies KnowclipActionCreatorsSubset

const addSubtitlesTrack = (track: SubtitlesTrack, mediaFileId: MediaFileId) =>
  filesActions.updateFile({
    fileType: 'MediaFile',
    updateName: 'addSubtitlesTrack',
    id: mediaFileId,
    updatePayload: [track],
  })

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
  deleteSubtitlesTrackFromMedia,
  linkFlashcardFieldToSubtitlesTrack,
}
