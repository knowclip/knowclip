type RawClozeRange = {
  clozeIndex: number
  startIndex: number
  fullMatchText: string
  tagContents: string
}

export const unescapeClozeFields = <F extends FlashcardFields>(
  fieldsFromJson?: Partial<F>
): { fields: Partial<F>; cloze: ClozeDeletion[] } => {
  const fields = {} as F
  if (!fieldsFromJson) return { fields, cloze: [] }
  const cloze: ClozeDeletion[] = []
  for (const fn in fieldsFromJson) {
    const fieldName: keyof F = fn
    const value: string = fieldsFromJson[fieldName] as any
    if (fieldName === 'transcription') {
      const { text, clozeDeletions } = unescapeClozeField(value)
      fields[fieldName] = (text as unknown) as F[keyof F]
      cloze.push(...clozeDeletions)
    } else {
      fields[fieldName] = (value as unknown) as F[keyof F]
    }
  }

  return { fields, cloze }
}

const clozeTagsRegex = new RegExp(
  `(?<!\\\\)\\{\\{c(10|[1-9])::(.*?)(?<!\\\\)\\}\\}`,
  'g'
)

export function unescapeClozeField(jsonText: string) {
  const matches = jsonText.matchAll(clozeTagsRegex)

  const rawRanges: RawClozeRange[] = []
  for (const match of matches) {
    const [fullMatchText, clozeNumberRaw, tagContents] = match
    const index = typeof match.index === 'number' ? match.index : -1
    const clozeNumber = +clozeNumberRaw

    rawRanges.push({
      startIndex: index,
      clozeIndex: clozeNumber - 1,
      fullMatchText,
      tagContents,
    })
  }

  if (!rawRanges.length) return { text: jsonText, clozeDeletions: [] }

  let text = ''
  const sparseDeletions: ClozeDeletion[] = []
  const firstRange = rawRanges[0]
  if (firstRange.startIndex > 0) {
    text += jsonText.slice(0, firstRange.startIndex)
  }

  let i = 0
  for (const rawRange of rawRanges) {
    const { ranges } = (sparseDeletions[rawRange.clozeIndex] = sparseDeletions[
      rawRange.clozeIndex
    ] || { ranges: [] })
    ranges.push({
      start: text.length,
      end: text.length + rawRange.tagContents.length,
    })
    text += rawRange.tagContents

    const nextRange = rawRanges[i + 1]
    const subsequentGapEnd = nextRange ? nextRange.startIndex : jsonText.length
    text += jsonText.slice(
      rawRange.startIndex + rawRange.fullMatchText.length,
      subsequentGapEnd
    )

    i++
  }

  const deletions: ClozeDeletion[] = []
  sparseDeletions.forEach(d => deletions.push(d))
  return { text: text, clozeDeletions: deletions }
}
