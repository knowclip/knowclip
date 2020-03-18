import { DeepPartial } from 'redux'
import { trimClozeRangeOverlaps } from '../utils/clozeRanges'
import * as A from '../types/ActionType'

export const addClip = (
  clip: Clip,
  flashcard: Flashcard,
  startEditing: boolean = false
): AddClip => ({
  type: A.ADD_CLIP,
  clip,
  flashcard,
  startEditing,
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

export const editClips = (
  edits: {
    id: ClipId
    override: DeepPartial<Clip> | null
    flashcardOverride: DeepPartial<Flashcard> | null
  }[]
): EditClips => ({
  type: A.EDIT_CLIPS,
  edits,
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

export const mergeClips = (
  ids: Array<ClipId>,
  newSelection: WaveformSelection | null
): ClipAction => ({
  type: A.MERGE_CLIPS,
  ids,
  newSelection,
})

export const setFlashcardField = (
  id: ClipId,
  key: FlashcardFieldName,
  value: string,
  caretLocation: number
): SetFlashcardField => ({
  type: A.SET_FLASHCARD_FIELD,
  id,
  key,
  value,
  caretLocation,
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

export const addClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  deletion: ClozeDeletion
): EditClip =>
  editClip(id, null, {
    cloze: trimClozeRangeOverlaps(
      currentCloze,
      deletion,
      currentCloze.length
    ).filter(({ ranges }) => ranges.length),
  })

export const editClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  clozeIndex: number,
  ranges: ClozeDeletion['ranges']
): EditClip =>
  editClip(id, null, {
    cloze: trimClozeRangeOverlaps(currentCloze, { ranges }, clozeIndex),
  })

export const removeClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  clozeIndex: number
): EditClip =>
  editClip(id, null, {
    cloze: currentCloze.filter((c, i) => i !== clozeIndex),
  })
