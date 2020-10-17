import * as yauzl from 'yauzl'
import { getTableName, LexiconEntry } from '../../files/dictionaryFile'
import { toHiragana } from 'wanakana'

export async function parseYomichanZip(
  file: YomichanDictionary,
  filePath: string,
  effects: EpicsDependencies
) {
  // create table for dictionary entry
  // for each term_bank_*.json file in archive
  // add to indexeddb
  let termBankMet = false
  return await new Promise((res, rej) => {
    return yauzl.open(filePath, { lazyEntries: true }, function(err, zipfile) {
      if (err) return rej(err)
      if (!zipfile) return rej(new Error('problem reading zip file'))

      const rejectAndClose = (err: any) => {
        rejectAndClose(err)
        zipfile.close()
      }
      console.log('importing!', new Date(Date.now()), Date.now())

      zipfile.on('entry', function(entry) {
        console.log(entry.uncompressedSize)
        if (/term_bank_/.test(entry.fileName)) {
          termBankMet = true

          console.log('match!')
          zipfile.openReadStream(entry, function(err, readStream) {
            if (err) return rejectAndClose(err)
            if (!readStream)
              return rejectAndClose(new Error('problem streaming zip file'))

            let rawJson = ''
            readStream.on('data', data => {
              rawJson += data.toString()
            })

            readStream.on('end', function() {
              // const [expression, reading, definitionTags, rules, score, glossary, sequence, termTags] = entry;
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
              rawJson = ''
              const entries: LexiconEntry[] = []
              for (const [
                head,
                pronunciation,
                tags,
                rules,
                frequencyScore,
                meanings,
                _sequence,
                _termTags,
              ] of entriesJSON) {
                const coercedHiragana = toHiragana(pronunciation || head)
                const dictEntry: LexiconEntry = {
                  variant: false,
                  dictionaryKey: file.key,
                  head,
                  pronunciation,
                  tags: [
                    ...new Set([...tags.split(' '), ...rules.split(' ')]),
                  ].join(' '),
                  frequencyScore,
                  meanings,
                  // searchStems: [],
                  // searchStemsSorted: '',
                  // searchTokens: [],
                  // searchTokensSorted: '',
                  tokenCombos:
                    coercedHiragana !== (pronunciation || head)
                      ? [coercedHiragana]
                      : [],
                  searchTokensCount: 0,
                }
                // console.log({ dictEntry })
                entries.push(dictEntry)
              }
              effects
                .getDexieDb()
                .table(getTableName(file.type))
                .bulkAdd(entries)
                .then(() => {
                  zipfile.readEntry()
                })
                .catch(err => rejectAndClose(err))
            })
          })
        } else {
          console.log('NO MATCH')
          zipfile.readEntry()
        }
      })

      zipfile.on('close', () => {
        console.log('import complete!', new Date(Date.now()), Date.now())

        if (termBankMet) res()
        else rej(new Error(`Invalid Yomichan dictionary file.`))
      })

      zipfile.readEntry()
    })
  })
}
