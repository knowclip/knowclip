import { fromEvent, of, concat, from, defer } from 'rxjs'
import { takeUntil, mergeMap, tap, map, catchError } from 'rxjs/operators'
import { Readable } from 'stream'
import * as yauzl from 'yauzl'
import { getTableName, LexiconEntry } from '../../files/dictionaryFile'
import { getDexieDb } from '../dictionariesDatabase'

export async function parseCedictZip(file: CEDictDictionary, filePath: string) {
  let termBankMet = false
  const zipfile: yauzl.ZipFile = await new Promise((res, rej) => {
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

      const entry: yauzl.Entry = _entry as any
      if (!/\.u8/.test(entry.fileName)) {
        zipfile.readEntry()
        return of(visitedEntries / entryCount)
      }
      termBankMet = true

      const entryReadStreamPromise: Promise<Readable> = new Promise(
        (res, rej) => {
          zipfile.openReadStream(entry as yauzl.Entry, (err, readStream) => {
            if (err) return rej(err)
            if (!readStream) return rej(new Error('problem streaming zip file'))

            res(readStream)
          })
        }
      )

      let entryBytesProcessed = 0
      const { uncompressedSize: entryTotalBytes } = entry
      return concat(
        from(entryReadStreamPromise).pipe(
          mergeMap((entryReadStream) => {
            const context = {
              nextChunkStart: '',
              buffer: [] as LexiconEntry[],
            }

            const readEntryObservable = fromEvent(entryReadStream, 'data').pipe(
              takeUntil(fromEvent(entryReadStream, 'end')),
              tap(async (_data) => {
                const data: Buffer = _data as any

                entryBytesProcessed += data.length

                try {
                  importDictionaryEntries(context, file, data)
                } catch (err) {
                  throw err
                }
              }),
              map(() => {
                const entryFractionProcessed =
                  (entryBytesProcessed / entryTotalBytes) * (1 / entryCount)
                return (
                  entryFractionProcessed + (visitedEntries - 1) / entryCount
                )
              })
            )

            return concat(
              readEntryObservable,
              defer(async () => {
                await null
                console.log(
                  'import complete!!',
                  new Date(Date.now()),
                  Date.now()
                )

                zipfile.readEntry()

                return visitedEntries / entryCount
              })
            )
          })
        )
        // TODO: stream error event?\
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
  context: { nextChunkStart: string; buffer: Omit<LexiconEntry, 'key'>[] },
  file: CEDictDictionary,
  data: Buffer
) {
  const lines = (context.nextChunkStart + data.toString()).split(/[\n\r]+/)
  const lastLineIndex = lines.length - 1
  context.nextChunkStart = lines[lastLineIndex]
  for (let i = 0; i < lastLineIndex; i++) {
    const line = lines[i]
    if (line && !line.startsWith('#') && i !== lastLineIndex) {
      // 一個人 一个人 [yi1 ge4 ren2] /by oneself (without assistance)/alone (without company)/
      const matchData = line.match(/^(\S+)\s+(\S+)\s+\[(.+)\]\s+\/(.+)\/$/)

      if (!matchData) {
        console.error(line)
        console.log('invalid line!', { line })
        throw new Error(`Invalid CEDict file format.`)
      }

      const [, trad, simpl, pinyin, en] = matchData
      const tradEntry: Omit<LexiconEntry, 'key'> = {
        head: trad,
        meanings: [en],
        tags: null,
        variant: trad === simpl ? null : simpl,
        pronunciation: pinyin,
        dictionaryKey: file.key,
        frequencyScore: null,
        tokenCombos: [],
        searchTokensCount: 0,
      }

      context.buffer.push(tradEntry)
      if (context.buffer.length >= 3000) {
        const oldBuffer = context.buffer
        context.buffer = []
        await getDexieDb()
          .table(getTableName(file.dictionaryType))
          .bulkAdd(oldBuffer)
      }
    }
  }
}
