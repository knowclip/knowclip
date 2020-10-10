import * as yauzl from 'yauzl'
import { combineEpics, ofType } from 'redux-observable'
import { catchError, flatMap } from 'rxjs/operators'
import * as A from '../types/ActionType'
import * as actions from '../actions'
import * as s from '../selectors'
import { deleteDictionary, newDictionary } from '../utils/dictionariesDatabase'
import { getFileFilters } from '../utils/files'
import {
  getTableName,
  LexiconEntry,
  LexiconMainEntry,
  LexiconVariantEntry,
} from '../files/dictionaryFile'
import { concat, from, of } from 'rxjs'
import { getGermanSearchTokens, getGermanDifferingStems } from '../utils/dictCc'
import { getTokenCombinations } from '../utils/tokenCombinations'
import { toHiragana } from 'wanakana'

const importDictionaryRequestEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, ImportDictionaryRequest>(A.IMPORT_DICTIONARY_REQUEST),
    flatMap(
      async (action): Promise<Action> => {
        try {
          const files = await effects.electron.showOpenDialog(
            getFileFilters(action.dictionaryType)
          )

          if (!files || !files.length)
            return ({ type: 'NOOP' } as unknown) as Action

          const [filePath] = files
          const dictionary = await newDictionary(
            effects.dexie,
            action.dictionaryType,
            filePath
          )
          if (s.isWorkUnsaved(state$.value))
            return actions.simpleMessageSnackbar(
              `Please save your work before trying to import a dictionary.`
            )

          // also progress
          return actions.startDictionaryImport(dictionary, filePath)
        } catch (err) {
          return actions.errorDialog(
            `There was a problem importing your dictionary: ${err}`,
            String(err)
          )
        }
      }
    )
  )

const startImportEpic: AppEpic = (action$, state$, effects) =>
  action$.ofType<StartDictionaryImport>('START_DICTIONARY_IMPORT').pipe(
    flatMap(({ file, filePath }) => {
      return concat(
        of(
          actions.setProgress({
            percentage: 50,
            message: 'Import in progress.',
          })
        ),
        from(parseDictionaryFile(file, filePath, effects)).pipe(
          flatMap(() => {
            return from([
              actions.openFileRequest(file, filePath),
              actions.setProgress(null),
              actions.addActiveDictionary(file.id, file.type),
              actions.simpleMessageSnackbar(
                `Mouse over flashcard text and press the 'D' key to look up words.`,
                null
              ),
            ])
          }),
          catchError(err => {
            console.error(err)

            deleteDictionary(
              effects.dexie,
              s.getOpenDictionaryFiles(state$.value).map(d => d.file),
              file.key,
              file.type
            )

            return from([
              actions.openFileFailure(file, filePath, String(err)),
              actions.setProgress(null),
            ])
          })
        )
      )
    })
  )

function parseDictionaryFile(
  file: DictionaryFile,
  filePath: string,
  effects: EpicsDependencies
) {
  switch (file.type) {
    case 'YomichanDictionary':
      return parseYomichanZip(file, filePath, effects)
    case 'CEDictDictionary':
      return parseCedictZip(file, filePath, effects)
    case 'DictCCDictionary':
      return parseDictCCZip(file, filePath, effects)
  }
}

// TODO: 'import complete' property

function onZipArchiveEntry(filePath: string, callback: Function) {
  // return new Promise((res, reject) => {
  //   yauzl.open(filePath, { lazyEntries: true }, function(err, zipfile) {
  //     if (err) return reject(err)
  //     if (!zipfile) throw new Error('problem reading zip file')
  //     const rejectAndClose = (err: any) => {
  //       rejectAndClose(err)
  //       zipfile.close()
  //     }
  //     // let cache: StemsCache = {}
  //     let total = 0
  //     zipfile.on('entry', entry => {
}

async function parseDictCCZip(
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
                    // searchTokensSorted: toSortedX(searchTokens),
                  })
                }
              }
              // total += entries.length
              if (buffer.length >= 2000) {
                const oldBuffer = buffer
                buffer = []

                console.log('2000 more!')
                await effects.dexie
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

async function parseCedictZip(
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
                    await effects.dexie
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

async function parseYomichanZip(
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
                rules, // v1: ichidan verb; v5: godan verb; vs: suru verb; vk: kuru verb; adj-i: i-adjective. An empty string corresponds to words which aren't inflected, such as nouns.
                frequencyScore,
                meanings,
                _sequence, // used for grouping results
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
              effects.dexie
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

export default combineEpics(importDictionaryRequestEpic, startImportEpic)
