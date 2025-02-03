import { getTableName, LegacyLexiconEntry } from '../../files/dictionaryFile'
import { getDexieDb } from '../dictionariesDatabase'

export async function importCedictEntries(
  data: string,
  file: CEDictDictionary
) {
  const lines = data.split(/[\n\r]+/)
  const lastLineIndex = lines.length - 1

  const entries: Omit<LegacyLexiconEntry, 'key'>[] = []

  for (let i = 0; i < lastLineIndex; i++) {
    const line = lines[i]
    if (line && !line.startsWith('#')) {
      // 一個人 一个人 [yi1 ge4 ren2] /by oneself (without assistance)/alone (without company)/
      const matchData = line.match(/^(\S+)\s+(\S+)\s+\[(.+)\]\s+\/(.+)\/$/)

      if (!matchData) {
        console.error(line)
        console.log('invalid line!', { line })
        throw new Error(
          `Invalid CEDict file format. Met line: ${JSON.stringify(
            cutOffWithEllipsis(line, 10)
          )}`
        )
      }

      const [, trad, simpl, pinyin, en] = matchData
      entries.push({
        head: trad,
        meanings: [en],
        tags: null,
        variant: trad === simpl ? null : simpl,
        pronunciation: pinyin,
        dictionaryKey: file.key,
        frequencyScore: null,
        tokenCombos: [],
        searchTokensCount: 0,
      })
    }
  }
  return await getDexieDb()
    .table(getTableName(file.dictionaryType))
    .bulkAdd(entries)
}

function cutOffWithEllipsis(str: string, length: number) {
  return str.length > length ? str.slice(0, length) + '...' : str
}
