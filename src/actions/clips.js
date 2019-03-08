export const addClip = (clip: Clip): ClipAction => ({
  type: 'ADD_CLIP',
  clip,
})

export const addClips = (
  clips: Array<Clip>,
  filePath: AudioFilePath
): ClipAction => ({
  type: 'ADD_CLIPS',
  clips,
  filePath,
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
