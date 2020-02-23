import { DeepPartial } from 'redux'

export const addClip = (clip: Clip, flashcard: Flashcard): ClipAction => ({
  type: A.ADD_CLIP,
  clip,
  flashcard,
})

export const addClips = (
  clips: Array<Clip>,
  flashcards: Array<Flashcard>,
  fileId: MediaFileId
): ClipAction => ({
  type: A.ADD_CLIPS,
  clips,
  flashcards,
  fileId,
})

export const selectWaveformItem = (
  selection: WaveformSelection | null
): SelectWaveformItem => ({
  type: A.SELECT_WAVEFORM_ITEM,
  selection,
})

export const clearWaveformSelection = (): SelectWaveformItem => ({
  type: A.SELECT_WAVEFORM_ITEM,
  selection: null,
})

export const highlightClip = (id: ClipId): SelectWaveformItem => ({
  type: A.SELECT_WAVEFORM_ITEM,
  selection: { type: 'Clip', id },
})

export const highlightSubtitles = (index: number): SelectWaveformItem => ({
  type: A.SELECT_WAVEFORM_ITEM,
  selection: { type: 'Preview', index },
})

export const highlightLeftClipRequest = (): HighlightLeftClipRequest => ({
  type: A.HIGHLIGHT_LEFT_CLIP_REQUEST,
})

export const highlightRightClipRequest = (): HighlightRightClipRequest => ({
  type: A.HIGHLIGHT_RIGHT_CLIP_REQUEST,
})

export const editClip = (
  id: ClipId,
  override: DeepPartial<Clip> | null,
  flashcardOverride: DeepPartial<Flashcard> | null
): EditClip => ({
  type: A.EDIT_CLIP,
  id,
  override,
  flashcardOverride,
})

export const addFlashcardImage = (id: ClipId, seconds?: number): EditClip => {
  const image: FlashcardImage = seconds
    ? {
        id,
        type: 'VideoStillImage',
        seconds,
      }
    : { id, type: 'VideoStillImage' }
  return {
    type: A.EDIT_CLIP,
    id,
    override: null,
    flashcardOverride: {
      image,
    },
  }
}

export const removeFlashcardImage = (id: ClipId): EditClip => ({
  type: A.EDIT_CLIP,
  id,
  flashcardOverride: { image: null },
  override: null,
})

export const mergeClips = (ids: Array<ClipId>): ClipAction => ({
  type: A.MERGE_CLIPS,
  ids,
})

export const setFlashcardField = (
  id: ClipId,
  key: FlashcardFieldName,
  value: string
): SetFlashcardField => ({
  type: A.SET_FLASHCARD_FIELD,
  id,
  key,
  value,
})

export const addFlashcardTag = (id: ClipId, text: string): Action => ({
  type: A.ADD_FLASHCARD_TAG,
  id,
  text,
})

export const deleteFlashcardTag = (
  id: ClipId,
  index: number,
  tag: string
): Action => ({
  type: A.DELETE_FLASHCARD_TAG,
  id,
  index,
  tag,
})

export const deleteCard = (id: ClipId): Action => ({
  type: A.DELETE_CARD,
  id,
})

export const deleteCards = (ids: Array<ClipId>): DeleteCards => ({
  type: A.DELETE_CARDS,
  ids,
})
