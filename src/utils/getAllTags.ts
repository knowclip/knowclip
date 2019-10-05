const getAllTags = (clipsById: { [clipId: string]: Clip }) => {
  const tags = new Set<string>()
  for (const id in clipsById) {
    clipsById[id].flashcard.tags.forEach(tag => tags.add(tag))
  }
  return tags
}

export default getAllTags
