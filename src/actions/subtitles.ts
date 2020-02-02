import { basename } from 'path'
import { openFileRequest } from './files'
import { uuid } from '../utils/sideEffects'
import { TransliterationFlashcardFields } from '../types/Project'

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

export const addSubtitlesTrack = (
  track: SubtitlesTrack
): AddSubtitlesTrack => ({
  type: A.ADD_SUBTITLES_TRACK,
  track,
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
    },
    filePath
  )

export const deleteSubtitlesTrackFromMedia = (
  id: SubtitlesTrackId,
  mediaFileId: MediaFileId
): DeleteSubtitlesTrack => ({
  type: A.DELETE_SUBTITLES_TRACK,
  id,
  mediaFileId,
})

export const makeClipsFromSubtitles = (
  fileId: MediaFileId,
  fieldNamesToTrackIds: Partial<TransliterationFlashcardFields> & {
    transcription: string
  },
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
