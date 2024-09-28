import { getTableName, LexiconEntry } from '../../files/dictionaryFile'
import { getGermanSearchTokens, getGermanDifferingStems } from '../dictCc'
import { getTokenCombinations } from '../tokenCombinations'
import { getDexieDb } from '../dictionariesDatabase'
import { MAX_GERMAN_SEARCH_TOKENS_COUNT } from './lookUpDictCc'

export async function importDictCcEntries(
  // context: { nextChunkStart: string; buffer: Omit<LexiconEntry, 'key'>[] },
  data: string,
  file: DictCCDictionary
) {
  const entries: Omit<LexiconEntry, 'key'>[] = []

  // const { nextChunkStart, buffer } = context
  // const lines = (nextChunkStart + data.toString()).split(/[\n\r]+/)
  const lines = data.trim().split(/[\n\r]+/)
  const lastLineIndex = lines.length - 1
  // context.nextChunkStart = lines[lastLineIndex]
  for (let i = 0; i < lastLineIndex; i++) {
    const line = lines[i]
    if (line && !line.startsWith('#') && i !== lastLineIndex) {
      // (aufgeregt) auffliegen~~~~~to flush [fly away]~~~~~verb~~~~~[hunting] [zool.]
      // Rosenwaldsänger {m}~~~~~pink-headed warbler [Ergaticus versicolor]	noun	[orn.]
      const [head, meaning, pos, endTags] = line.split('\t')
      const searchTokens = getGermanSearchTokens(head)
      if (!searchTokens.length) continue

      const searchStems = getGermanDifferingStems(head)
      const grammTags = [...head.matchAll(/\{.+?}/g)] || []

      if (searchTokens.length !== searchStems.length) {
        console.error('mismatch')
        console.log({ searchStems, searchTokens })
      }

      // if (searchStems.length > MAX_GERMAN_SEARCH_TOKENS_COUNT) console.log(head, searchStems.join(' '))

      entries.push({
        head,
        meanings: [meaning],
        tags: `${[
          ...(pos ? [pos] : []),
          ...(endTags ? endTags.split(/\s+/) : []),
          ...grammTags,
        ].join(' ')}`,
        variant: null,
        pronunciation: null,
        dictionaryKey: file.key,
        frequencyScore: null,
        searchTokensCount: searchTokens.length,
        tokenCombos:
          // TODO: should get chunks from all places, just doing the start for now
          getTokenCombinations(
            searchStems.slice(0, MAX_GERMAN_SEARCH_TOKENS_COUNT)
          ).map((tokenCombo) => {
            return [
              ...tokenCombo.sort(),
              searchStems.length.toString(16).padStart(2, '0'),
            ].join(' ')
          }),
      })
    }
  }
  // if (buffer.length >= 2000) {
  //   const oldBuffer = buffer
  //   context.buffer = []

  await getDexieDb().table(getTableName(file.dictionaryType)).bulkAdd(entries)
  // }
}
