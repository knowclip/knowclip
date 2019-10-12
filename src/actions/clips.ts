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

export const editClip = (id: ClipId, override: Partial<Clip>): ClipAction => ({
  type: A.EDIT_CLIP,
  id,
  override,
})

export const mergeClips = (ids: Array<ClipId>): ClipAction => ({
  type: A.MERGE_CLIPS,
  ids,
})
