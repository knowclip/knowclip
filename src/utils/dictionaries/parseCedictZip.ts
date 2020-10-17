import * as yauzl from 'yauzl'
import {
  getTableName,
  LexiconEntry,
  LexiconMainEntry,
  LexiconVariantEntry,
} from '../../files/dictionaryFile'

export async function parseCedictZip(
  file: CEDictDictionary,
  filePath: string,
  effects: EpicsDependencies
) {
  let textFileMet = false

  return new Promise((res, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, function(err, zipfile) {
      if (err) return reject(err)
      if (!zipfile) throw new Error('problem reading zip file')

      const rejectAndClose = (err: any) => {
        rejectAndClose(err)
        zipfile.close()
      }

      console.log('importing cedict!', new Date(Date.now()), Date.now())
      zipfile.on('entry', entry => {
        if (/cedict_ts\.u8/.test(entry.fileName)) {
          textFileMet = true

          zipfile.openReadStream(entry, function(err, readStream) {
            if (err) return rejectAndClose(err)
            if (!readStream)
              return rejectAndClose(new Error('problem streaming zip file'))
            // reading = true
            let buffer: LexiconEntry[] = []

            let nextChunkStart = ''
            readStream.on('data', async data => {
              console.log('stream read working')
              const lines = (nextChunkStart + data.toString()).split(/[\n\r]+/)
              const lastLineIndex = lines.length - 1
              nextChunkStart = lines[lastLineIndex]
              for (let i = 0; i < lastLineIndex; i++) {
                const line = lines[i]
                if (line && !line.startsWith('#') && i !== lastLineIndex) {
                  // 一個人 一个人 [yi1 ge4 ren2] /by oneself (without assistance)/alone (without company)/
                  const matchData = line.match(
                    /^(\S+)\s+(\S+)\s+\[(.+)\]\s+\/(.+)\/$/
                  )

                  if (!matchData) {
                    console.error(line)
                    console.log('invalid line!', { line })
                    return rejectAndClose(`Invalid CEDict file format.`)
                  }

                  const [, trad, simpl, pinyin, en] = matchData
                  const tradEntry: LexiconMainEntry = {
                    head: trad,
                    meanings: [en],
                    tags: null,
                    variant: false,
                    pronunciation: pinyin,
                    dictionaryKey: file.key,
                    frequencyScore: null,
                    // searchStems: [],
                    // searchStemsSorted: '',
                    // searchTokens: [],
                    // searchTokensSorted: '',
                    tokenCombos: [],
                    searchTokensCount: 0,
                  }
                  const simplEntry: LexiconVariantEntry = {
                    variant: true,
                    head: simpl,
                    mainEntry: trad,
                    dictionaryKey: file.key,
                  }
                  buffer.push(tradEntry, simplEntry)
                  // if (i< 20)
                  // console.log({ trad, simpl, pinyin, en })
                  if (buffer.length >= 3000) {
                    const oldBuffer = buffer
                    buffer = []
                    await effects
                      .getDexieDb()
                      .table(getTableName(file.type))
                      .bulkAdd(oldBuffer)
                      .catch(err => rejectAndClose(err))
                  }
                }
              }
            })

            readStream.on('end', function() {
              // should process leftovers from final chunk
              zipfile.readEntry()
            })
          })
        } else {
          zipfile.readEntry()
        }
      })

      zipfile.on('close', () => {
        console.log('done importing cedict!', new Date(Date.now()), Date.now())
        if (textFileMet) res()
        else reject(new Error(`Invalid CEDict dictionary file.`))
      })

      zipfile.readEntry()
    })
  })
}
