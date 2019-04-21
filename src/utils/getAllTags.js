// @flow
const getAllTags = (clipsById: {
  [ClipId]: Clip | ClipPre3_0_0,
}): Set<string> => {
  const tags = new Set()
  for (const id in clipsById) {
    clipsById[id].flashcard.tags.forEach(tag => tags.add(tag))
  }
  return tags
}

export default getAllTags
