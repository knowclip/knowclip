const getAllTags = clipsById => {
  const tags = new Set()
  for (const id in clipsById) {
    clipsById[id].flashcard.tags.forEach(tag => tags.add(tag))
  }
  return tags
}

export default getAllTags
