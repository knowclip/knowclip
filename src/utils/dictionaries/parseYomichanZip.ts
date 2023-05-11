import type { ZipFile, Entry } from 'yauzl'
import * as yauzl from '../../preloaded/yauzl'
import { getTableName, LexiconEntry } from '../../files/dictionaryFile'
import { toHiragana } from 'wanakana'
import { getDexieDb } from '../dictionariesDatabase'
import { concat, defer, from, fromEvent, of } from 'rxjs'
import { catchError, map, mergeMap, takeUntil, tap } from 'rxjs/operators'
import type { Readable } from 'stream'

export async function parseYomichanZip(
  file: YomichanDictionary,
  filePath: string
) {
  let termBankMet = false
  const zipfile: ZipFile = await new Promise((res, rej) => {
    yauzl.open(filePath, { lazyEntries: true }, function (err, zipfile) {
      if (err) return rej(err)
      if (!zipfile) return rej(new Error('problem reading zip file'))

      res(zipfile)
    })
  })

  const { entryCount } = zipfile

  let visitedEntries = 0

  const entriesObservable = fromEvent(zipfile, 'entry').pipe(
    takeUntil(fromEvent(zipfile, 'close')),
    mergeMap((_entry) => {
      visitedEntries++

      const entry: Entry = _entry as any
      if (!/term_bank_/.test(entry.fileName)) {
        zipfile.readEntry()
        return of(visitedEntries / entryCount)
      }
      termBankMet = true

      const entryReadStreamPromise: Promise<Readable> = new Promise(
        (res, rej) => {
          zipfile.openReadStream(entry as Entry, (err, readStream) => {
            if (err) return rej(err)
            if (!readStream) return rej(new Error('problem streaming zip file'))

            res(readStream)
          })
        }
      )

      let rawJson = ''
      let entryBytesProcessed = 0
      const { uncompressedSize: entryTotalBytes } = entry
      return concat(
        from(entryReadStreamPromise).pipe(
          mergeMap((entryReadStream) =>
            fromEvent(entryReadStream, 'data').pipe(
              takeUntil(fromEvent(entryReadStream, 'end'))
            )
          ),
          tap((_data) => {
            const data: Buffer = _data as any
            rawJson += data.toString()

            entryBytesProcessed += data.length
          }),
          map(() => {
            const entryFractionProcessed =
              (entryBytesProcessed / entryTotalBytes) * (1 / entryCount)
            return entryFractionProcessed + (visitedEntries - 1) / entryCount
          })
        ),

        defer(async () => {
          await importDictionaryEntries(rawJson, file)

          zipfile.readEntry()
          return visitedEntries / entryCount
        })
      )
    })
  )

  const progressObservable = concat(
    entriesObservable,
    defer(async () => {
      await null

      console.log('import complete!', new Date(Date.now()), Date.now())

      if (!termBankMet) throw new Error(`Invalid dictionary file.`)

      return 100
    })
  ).pipe(
    catchError((err) => {
      zipfile.close()
      throw err
    })
  )

  zipfile.readEntry()

  return progressObservable
}

async function importDictionaryEntries(
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
