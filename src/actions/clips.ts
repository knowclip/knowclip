import { DeepPartial } from 'redux'
import { trimClozeRangeOverlaps } from '../utils/clozeRanges'
import A from '../types/ActionType'
import { PrimaryClip, WaveformDrag, WaveformRegion } from 'clipwave'
import { SubtitlesCardBase } from '../selectors'
import { defineActionCreators } from './defineActionCreators'

export type OverlappedCardBaseDuringClipStretch = {
  subtitlesCardBase: SubtitlesCardBase
  isSelectable: boolean
}

export const clipsActions = defineActionCreators({
  addClipRequest: (waveformDrag: WaveformDrag, clipId: Clip['id']) => ({
    type: A.addClipRequest,
    waveformDrag,
    clipId,
  }),

  stretchClip: (
    stretchedClip: { id: Clip['id']; start: number; end: number },
    overlappedClips: PrimaryClip[],
    unstretchedClip: { id: Clip['id']; start: number; end: number },
    frontOverlappedSubtitlesCardBases: OverlappedCardBaseDuringClipStretch[],
    backOverlappedSubtitlesCardBases: OverlappedCardBaseDuringClipStretch[],
    newRegions: WaveformRegion[]
  ) => ({
    type: A.stretchClip,
    stretchedClip,
    overlappedClips,
    unstretchedClip,
    frontOverlappedSubtitlesCardBases,
    backOverlappedSubtitlesCardBases,
    newRegions,
  }),

  addClip: (
    clip: Clip,
    flashcard: Flashcard,
    startEditing: boolean = false
  ) => ({
    type: A.addClip,
    clip,
    flashcard,
    startEditing,
  }),

  addClips: (
    clips: Array<Clip>,
    flashcards: Array<Flashcard>,
    fileId: MediaFileId
  ) => ({
    type: A.addClips,
    clips,
    flashcards,
    fileId,
  }),

  /** Pass `null` to indicate waveform reset */
  selectWaveformItem: (selection: WaveformSelection | null) => ({
    type: A.selectWaveformItem,
    selection,
  }),

  editClip: (
    id: ClipId,
    override: DeepPartial<Clip> | null,
    flashcardOverride: DeepPartial<Flashcard> | null
  ) => ({
    type: A.editClip,
    id,
    override,
    flashcardOverride,
  }),

  editClips: (
    edits: {
      id: ClipId
      override: DeepPartial<Clip> | null
      flashcardOverride: DeepPartial<Flashcard> | null
    }[]
  ) => ({
    type: A.editClips,
    edits,
  }),

  mergeClips: (ids: Array<ClipId>, newSelection: WaveformSelection) => ({
    type: A.mergeClips,
    ids,
    newSelection,
  }),

  moveClip: (
    id: ClipId,
    deltaX: number,
    overlapIds: Array<ClipId>,
    newRegions: WaveformRegion[]
  ) => ({
    type: A.moveClip,
    id,
    deltaX,
    overlapIds,
    newRegions,
  }),

  setFlashcardField: (
    id: ClipId,
    key: FlashcardFieldName,
    value: string,
    caretLocation: number
  ) => ({
    type: A.setFlashcardField,
    id,
    key,
    value,
    caretLocation,
  }),

  addFlashcardTag: (id: ClipId, text: string) => ({
    type: A.addFlashcardTag,
    id,
    text,
  }),

  deleteFlashcardTag: (id: ClipId, index: number, tag: string) => ({
    type: A.deleteFlashcardTag,
    id,
    index,
    tag,
  }),

  deleteCard: (id: ClipId) => ({
    type: A.deleteCard,
    id,
  }),

  deleteCards: (ids: Array<ClipId>) => ({
    type: A.deleteCards,
    ids,
  }),
})

const addFlashcardImage = (id: ClipId, seconds?: number) => {
  const image: FlashcardImage = seconds
    ? {
        id,
        type: 'VideoStillImage',
        seconds,
      }
    : { id, type: 'VideoStillImage' }
  return clipsActions.editClip(id, null, {
    image,
  })
}

const removeFlashcardImage = (id: ClipId) =>
  clipsActions.editClip(id, null, { image: null })

const addClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  deletion: ClozeDeletion
) =>
  clipsActions.editClip(id, null, {
    cloze: trimClozeRangeOverlaps(
      currentCloze,
      deletion,
      currentCloze.length
    ).filter(({ ranges }) => ranges.length),
  })

const editClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  clozeIndex: number,
  ranges: ClozeDeletion['ranges']
) =>
  clipsActions.editClip(id, null, {
    cloze: trimClozeRangeOverlaps(currentCloze, { ranges }, clozeIndex),
  })

const removeClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  clozeIndex: number
) =>
  clipsActions.editClip(id, null, {
    cloze: currentCloze.filter((_c, i) => i !== clozeIndex),
  })

export const compositeClipsActions = {
  addFlashcardImage,
  removeFlashcardImage,
  addClozeDeletion,
  editClozeDeletion,
  removeClozeDeletion,
}
