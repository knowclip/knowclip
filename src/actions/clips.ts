import { DeepPartial } from 'redux'

export const addClip = (clip: Clip): ClipAction => ({
  type: A.ADD_CLIP,
  clip,
})

export const addClips = (
  clips: Array<Clip>,
  fileId: MediaFileId
): ClipAction => ({
  type: A.ADD_CLIPS,
  clips,
  fileId,
})

export const highlightClip = (id: ClipId | null): HighlightClip => ({
  type: A.HIGHLIGHT_CLIP,
  id,
})

export const highlightLeftClipRequest = (): HighlightLeftClipRequest => ({
  type: A.HIGHLIGHT_LEFT_CLIP_REQUEST,
})

export const highlightRightClipRequest = (): HighlightRightClipRequest => ({
  type: A.HIGHLIGHT_RIGHT_CLIP_REQUEST,
})

export const editClip = (
  id: ClipId,
  override: DeepPartial<Clip>
): EditClip => ({
  type: A.EDIT_CLIP,
  id,
  override,
})

export const addFlashcardImage = (id: ClipId, seconds: number): EditClip => {
  const image: FlashcardImage = {
    id,
    type: 'VideoStillImage',
    seconds,
  }
  return {
    type: A.EDIT_CLIP,
    id,
    override: {
      flashcard: {
        image,
      },
    },
  }
}

export const removeFlashcardImage = (id: ClipId): EditClip => ({
  type: A.EDIT_CLIP,
  id,
  override: {
    flashcard: { image: null },
  },
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
