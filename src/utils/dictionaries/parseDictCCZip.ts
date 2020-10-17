import * as yauzl from 'yauzl'
import { getTableName, LexiconEntry } from '../../files/dictionaryFile'
import {
  getGermanSearchTokens,
  getGermanDifferingStems,
} from '../../utils/dictCc'
import { getTokenCombinations } from '../../utils/tokenCombinations'

export async function parseDictCCZip(
  file: DictCCDictionary,
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
      zipfile.on('entry', entry => {
        console.log('cc', { entry })
        if (/\.txt/.test(entry.fileName)) {
          textFileMet = true
          console.log('importing!', new Date(Date.now()), Date.now())

          zipfile.openReadStream(entry, function(err, readStream) {
            if (err) return rejectAndClose(err)
            if (!readStream)
              return rejectAndClose(new Error('problem streaming zip file'))

            let nextChunkStart = ''

            let buffer: LexiconEntry[] = []
            readStream.on('data', async data => {
              // const entries: LexiconEntry[] = []
              const lines = (nextChunkStart + data.toString()).split(/[\n\r]+/)
              const lastLineIndex = lines.length - 1
              nextChunkStart = lines[lastLineIndex]
              for (let i = 0; i < lastLineIndex; i++) {
                const line = lines[i]
                // console.log(line, "!line.startsWith('#') && i !== lastLineIndex", !line.startsWith('#'), i !== lastLineIndex)
                if (line && !line.startsWith('#') && i !== lastLineIndex) {
                  // (aufgeregt) auffliegen~~~~~to flush [fly away]~~~~~verb~~~~~[hunting] [zool.]
                  // Rosenwaldsänger {m}~~~~~pink-headed warbler [Ergaticus versicolor]	noun	[orn.]
                  const [head, meaning, pos, endTags] = line.split('\t')
                  // strip affixes and bits inside curly braces
                  const searchTokens = getGermanSearchTokens(head)
                  if (!searchTokens.length) continue

                  const searchStems = getGermanDifferingStems(head)
                  const grammTags = [...head.matchAll(/\{.+?}/g)] || []

                  if (searchTokens.length !== searchStems.length) {
                    console.error('mismatch')
                    console.log({ searchStems, searchTokens })
                  }

                  if (searchStems.length > 5)
                    console.log(head, searchStems.join(' '))

                  buffer.push({
                    head,
                    meanings: [meaning],
                    tags: `${pos}\n${endTags}\n${grammTags.join(' ')}`,
                    variant: false,
                    pronunciation: null,
                    dictionaryKey: file.key,
                    frequencyScore: null,
                    // searchStems,
                    // searchStemsSorted: toSortedX(searchStems),
                    // searchTokens,
                    searchTokensCount: searchTokens.length,
                    tokenCombos:
                      // should get chunks from all places, just doing the start for now
                      getTokenCombinations(searchStems.slice(0, 5)).map(
                        tokenCombo => {
                          return [
                            ...tokenCombo.sort(),
                            searchStems.length.toString(16).padStart(2, '0'),
                          ].join(' ')
                        }
                      ),
                  })
                }
              }
              // total += entries.length
              if (buffer.length >= 2000) {
                const oldBuffer = buffer
                buffer = []

                console.log('2000 more!')
                await effects
                  .getDexieDb()
                  .table(getTableName(file.type))
                  .bulkAdd(oldBuffer)
                  .catch(err => rejectAndClose(err))
              }
            })

            readStream.on('end', async function() {
              // TODO: should process leftovers from final chunk
              zipfile.readEntry()
            })
          })
        } else {
          zipfile.readEntry()
        }
      })

      zipfile.on('close', () => {
        console.log('done importing!', new Date(Date.now()), Date.now())
        if (textFileMet) res()
        else reject(new Error(`Invalid dict.cc dictionary file.`))
      })

      zipfile.readEntry()
    })
  })
}
