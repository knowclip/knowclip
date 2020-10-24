import * as A from '../types/ActionType'
import { basename } from 'path'
import { openFileRequest } from './files'
import { uuid } from '../utils/sideEffects'
import { TransliterationFlashcardFields } from '../types/Project'

export const showSubtitles = (id: SubtitlesTrackId): ShowSubtitles => ({
  type: A.SHOW_SUBTITLES,
  id,
})

export const hideSubtitles = (id: SubtitlesTrackId): HideSubtitles => ({
  type: A.HIDE_SUBTITLES,
  id,
})

export const mountSubtitlesTrack = (
  track: SubtitlesTrack
): MountSubtitlesTrack => ({
  type: A.MOUNT_SUBTITLES_TRACK,
  track,
})

export const addSubtitlesTrack = (
  track: SubtitlesTrack,
  mediaFileId: MediaFileId
): UpdateFileWith<'addSubtitlesTrack'> => ({
  type: A.UPDATE_FILE,
  update: {
    updateName: 'addSubtitlesTrack',
    id: mediaFileId,
    updatePayload: [track],
  },
})

export const loadNewSubtitlesFile = (
  filePath: string,
  mediaFileId: MediaFileId
): OpenFileRequest =>
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

export const deleteSubtitlesTrackFromMedia = (
  id: SubtitlesTrackId,
  mediaFileId: MediaFileId
): UpdateFileWith<'deleteSubtitlesTrack'> => ({
  type: A.UPDATE_FILE,
  update: {
    updateName: 'deleteSubtitlesTrack',
    id: mediaFileId,
    updatePayload: [id],
  },
})

export const makeClipsFromSubtitles = (
  fileId: MediaFileId,
  fieldNamesToTrackIds: Partial<TransliterationFlashcardFields>,
  tags: Array<string>,
  includeStill: boolean
): MakeClipsFromSubtitles => ({
  type: A.MAKE_CLIPS_FROM_SUBTITLES,
  fileId,
  fieldNamesToTrackIds,
  tags,
  includeStill,
})

export const subtitlesClipsDialogRequest = (): ShowSubtitlesClipsDialogRequest => ({
  type: A.SHOW_SUBTITLES_CLIPS_DIALOG_REQUEST,
})

export const linkFlashcardFieldToSubtitlesTrackRequest = (
  flashcardFieldName: FlashcardFieldName,
  mediaFileId: MediaFileId,
  subtitlesTrackId: SubtitlesTrackId | null
): LinkFlashcardFieldToSubtitlesTrackRequest => ({
  type: A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK_REQUEST,
  flashcardFieldName,
  mediaFileId,
  subtitlesTrackId,
})

export const linkFlashcardFieldToSubtitlesTrack = (
  flashcardFieldName: FlashcardFieldName,
  mediaFileId: MediaFileId,
  subtitlesTrackId: SubtitlesTrackId | null,
  fieldToClear?: FlashcardFieldName
): UpdateFileWith<'linkFlashcardFieldToSubtitlesTrack'> => ({
  type: A.UPDATE_FILE,
  update: {
    updateName: 'linkFlashcardFieldToSubtitlesTrack',
    id: mediaFileId,
    updatePayload: [flashcardFieldName, subtitlesTrackId, fieldToClear || null],
  },
})

export const goToSubtitlesChunk = (
  subtitlesTrackId: SubtitlesTrackId,
  chunkIndex: number
): GoToSubtitlesChunk => ({
  type: A.GO_TO_SUBTITLES_CHUNK,
  subtitlesTrackId,
  chunkIndex,
})
