import yomichanLemmatization from './yomichanLemmatization.json'

// TODO: maybe would be better to turn yomichanLemmatization into a map?
const cache: { [text: string]: PotentialLemma[] } = {}

export function lemmatize(text: string) {
  if (cache[text]) return cache[text]

  return (cache[text] = lemmatizeRecursive(text, [], []))
}

type PotentialLemma = {
  text: string
  inferredInflections: string[]
  wordClasses: string[]
}
function lemmatizeRecursive(
  text: string,
  wordClasses: string[],
  soFar: PotentialLemma[],
  inflectionsChain: string[] = []
): PotentialLemma[] {
  const newCandidates: PotentialLemma[] = []

  for (const inflectionName in yomichanLemmatization) {
    const transforms =
      yomichanLemmatization[
        inflectionName as keyof typeof yomichanLemmatization
      ]
    for (const transform of transforms) {
      const { kanaIn, kanaOut, rulesIn, rulesOut } = transform
      if (
        text.endsWith(kanaIn) &&
        (!rulesIn.length ||
          !wordClasses.length ||
          rulesIn.some((wc) => wordClasses.includes(wc)))
      ) {
        const candidateText = text.replace(new RegExp(`${kanaIn}$`), kanaOut)
        if (
          candidateText &&
          !soFar.some(
            (l) =>
              l.text === candidateText &&
              l.inferredInflections[l.inferredInflections.length - 1] ===
                inflectionName
          )
        ) {
          const newCandidate: PotentialLemma = {
            text: candidateText,
            // for debugging:
            // from: { text, wordClasses },
            inferredInflections: [...inflectionsChain, inflectionName],
            wordClasses: rulesOut,
          }
          newCandidates.push(newCandidate)
          soFar.push(newCandidate)
        }
      }
    }
  }

  if (!newCandidates.length) return []

  return newCandidates.flatMap((candidate) => [
    candidate,
    ...lemmatizeRecursive(
      candidate.text,
      candidate.wordClasses,
      soFar,
      candidate.inferredInflections
    ),
  ])
}
