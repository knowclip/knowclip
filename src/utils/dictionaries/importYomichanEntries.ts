import { getTableName, LexiconEntry } from '../../files/dictionaryFile'
import { toHiragana } from 'wanakana'
import { getDexieDb } from '../dictionariesDatabase'

export async function importYomichanEntries(
  rawJson: string,
  file: YomichanDictionary
) {
  const entriesJSON = JSON.parse(rawJson) as [
    string,
    string,
    string,
    string,
    number,
    string[],
    number,
    string
  ][]

  const entries: Omit<LexiconEntry, 'key'>[] = []
  for (const [
    head,
    pronunciation,
    tags,
    rules,
    frequencyScore,
    meanings,
    _sequence,
    termTags,
  ] of entriesJSON) {
    const coercedHiragana = toHiragana(pronunciation || head)
    const dictEntry: Omit<LexiconEntry, 'key'> = {
      variant: null,
      dictionaryKey: file.key,
      head,
      pronunciation,
      tags: [
        ...new Set([
          ...tags.split(' '),
          ...rules.split(' '),
          ...(termTags ? termTags.split(' ').map((t) => `[${t}]`) : termTags),
        ]),
      ].join(' '),
      frequencyScore,
      meanings,
      tokenCombos:
        coercedHiragana !== (pronunciation || head) ? [coercedHiragana] : [],
      searchTokensCount: 0,
    }
    entries.push(dictEntry)
  }

  await getDexieDb().table(getTableName(file.dictionaryType)).bulkAdd(entries)
}
