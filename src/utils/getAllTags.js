// @flow
const getAllTags = (clipsById: { [ClipId]: Clip }): Set<string> => {
  const tags = new Set()
  for (const id in clipsById) {
    clipsById[id].flashcard.tags.forEach(tag => tags.add(tag))
  }
  return tags
}

export default getAllTags
