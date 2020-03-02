type RawClozeRange = {
  startIndex: number
  fullMatchText: string
  tagContents: string
}

export const unescapeClozeFields = <F extends FlashcardFields>(
  fieldsFromJson?: Partial<F>
): { fields: Partial<F>; cloze: ClozeDeletion[] } => {
  console.log('UNESCAPING!!')
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

const clozeTagsRegex = new RegExp(`<c(10|[1-9])>(.*?)</c>`, 'g')

export function unescapeClozeField(text: string) {
  const matches = [...text.matchAll(clozeTagsRegex)]

  let result = ''
  const rawRangeGroups = matches
    .reduce(
      (deletions, match) => {
        const [fullMatchText, clozeNumberRaw, tagContents] = match
        const index = typeof match.index === 'number' ? match.index : -1
        const clozeNumber = +clozeNumberRaw

        deletions[clozeNumber - 1] = deletions[clozeNumber - 1] || []
        deletions[clozeNumber - 1].push({
          startIndex: index,
          fullMatchText,
          tagContents,
        })
        return deletions
      },
      [] as RawClozeRange[][]
    )
    .filter(r => r && r.length)

  if (!rawRangeGroups.length) return { text, clozeDeletions: [] }

  const deletions: ClozeDeletion[] = rawRangeGroups.map(
    (rawRanges, rangeGroupIndex) => {
      const ranges: ClozeRange[] = []

      const firstRange = rawRanges[0]
      if (rangeGroupIndex === 0 && firstRange.startIndex > 0) {
        result += text.slice(0, firstRange.startIndex)
      }

      let i = 0
      for (const rawRange of rawRanges) {
        ranges.push({
          start: result.length,
          end: result.length + rawRange.tagContents.length,
        })
        result += rawRange.tagContents

        const nextRange = rawRanges[i + 1]
        const subsequentGapEnd = nextRange ? nextRange.startIndex : text.length
        result += text.slice(
          rawRange.startIndex + rawRange.fullMatchText.length,
          subsequentGapEnd
        )

        i++
      }

      return { ranges }
    }
  )

  return { text: result, clozeDeletions: deletions }
}
