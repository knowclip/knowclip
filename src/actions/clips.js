// @flow

export const addClip = (clip: Clip): ClipAction => ({
  type: 'ADD_CLIP',
  clip,
})

export const addClips = (
  clips: Array<Clip>,
  fileId: AudioFileId
): ClipAction => ({
  type: 'ADD_CLIPS',
  clips,
  fileId,
})

export const highlightClip = (id: ?ClipId): ClipAction => ({
  type: 'HIGHLIGHT_CLIP',
  id,
})

export const editClip = (id: ClipId, override: $Shape<Clip>): ClipAction => ({
  type: 'EDIT_CLIP',
  id,
  override,
})

export const mergeClips = (ids: Array<ClipId>): ClipAction => ({
  type: 'MERGE_CLIPS',
  ids,
})
