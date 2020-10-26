const getAllTags = (flashcards: Record<ClipId, Flashcard>) => {
  const tags = new Set<string>()
  for (const id in flashcards) {
    flashcards[id].tags.forEach((tag) => tags.add(tag))
  }
  return tags
}

export default getAllTags
