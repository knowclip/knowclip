import * as r from '../redux'
import {
  DeleteFileRequestHandler,
  DeleteFileSuccessHandler,
  FileEventHandlers,
} from './eventHandlers'
import * as yauzl from 'yauzl'
import { extname } from 'path'
import { deleteDictionary } from '../utils/dictionaryFiles'

// https://github.com/FooSoft/yomichan/blob/1078ab99b7a9d082ee36cbed69c8cb154db318b6/ext/bg/js/settings/dictionary-import-controller.js

// unzip/parse json code from yomichan
// https://github.com/FooSoft/yomichan/blob/1078ab99b7a9d082ee36cbed69c8cb154db318b6/ext/bg/js/dictionary-importer.js

export type LexiconEntry = LexiconMainEntry | LexiconVariantEntry
export type LexiconMainEntry = {
  variant: false
  dictionaryId: number
  head: string
  meanings: string[]
  /** parts of speech etc. */
  tags: string | null
  pronunciation: string | null
  frequencyScore: number | null
}
export type LexiconVariantEntry =
  // for trad/simpl chinese
  {
    variant: true
    dictionaryId: number
    head: string
    mainEntry: string
  }

export const getTableName = (type: DictionaryFileType) => `${type}`

const deleteRequest: DeleteFileRequestHandler<DictionaryFile> = async (
  file,
  availability,
  descendants,
  state,
  effects
) => {
  if (file) {
    try {
      await deleteDictionary(
        effects.dexie,
        r.getOpenDictionaryFiles(state).map(d => d.file),
        +file.id,
        file.type
      )

      return [
        r.removeActiveDictionary(file.id),
        r.deleteFileSuccess(availability, []),
      ]
    } catch (err) {
      return [
        r.errorDialog(
          `There was a problem deleting this dictionary file: ${err}`,
          String(err)
        ),
      ]
    }
  }

  return [r.deleteFileSuccess(availability, [])]
}
const deleteSuccess: DeleteFileSuccessHandler = async (
  { file },
  state,
  effects
) => {
  return [r.commitFileDeletions(file.type)]
}

// // Read and validate index
// const indexFileName = 'index.json';
// const indexFile = archive.files[indexFileName];
// if (!indexFile) {
//     throw new Error('No dictionary index found in archive');
// }

// const index = JSON.parse(await indexFile.async('string'));

// const indexSchema = await this._getSchema('/bg/data/dictionary-index-schema.json');
// this._validateJsonSchema(index, indexSchema, indexFileName);

// const dictionaryTitle = index.title;
// const version = index.format || index.version;

// if (!dictionaryTitle || !index.revision) {
//     throw new Error('Unrecognized dictionary format');
// }
async function parseYomichanZip(
  file: YomichanDictionary,
  filePath: string,
  effects: EpicsDependencies
) {
  // create table for dictionary entry
  // for each term_bank_*.json file in archive
  // add to indexeddb
  return new Promise((res, rej) => {
    return yauzl.open(filePath, { lazyEntries: true }, function(err, zipfile) {
      if (err) return rej(err)
      if (!zipfile) throw new Error('problem reading zip file')
      zipfile.on('entry', function(entry) {
        if (/term_bank_/.test(entry.fileName)) {
          console.log('match!')
          // file entry
          zipfile.openReadStream(entry, function(err, readStream) {
            if (err) return rej(err)
            if (!readStream) return rej(new Error('problem streaming zip file'))

            let rawJson = ''
            readStream.on('data', data => {
              rawJson += data.toString()
            })

            readStream.on('end', function() {
              const entriesJSON = JSON.parse(rawJson) as [
                string,
                string,
                string,
                string,
                number,
                string[],
                string
              ][]
              const entries: LexiconEntry[] = []
              // [["ライフハックス","","n","",2,["life hack","life hacks"]
              // const [expression, reading, definitionTags, rules, score, glossary, sequence, termTags] = entry;f
              // return {expression, reading, definitionTags, rules, score, glossary, sequence, termTags};
              for (const [
                head,
                pronunciation,
                pos,
                _rules,
                frequencyScore,
                meanings,
                _termTags,
              ] of entriesJSON) {
                const dictEntry: LexiconEntry = {
                  variant: false,
                  dictionaryId: +file.id,
                  head,
                  pronunciation,
                  tags: pos,
                  frequencyScore,
                  meanings,
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
                .catch(err => rej(err))
            })
          })
        } else {
          console.log('NO MATCH')
          zipfile.readEntry()
        }
      })

      zipfile.on('close', () => {
        res()
      })

      zipfile.readEntry()
    })
  })
}

const currentlyImporting = (state: AppState, file: DictionaryFile) => {
  const availability = r.getFileAvailability(state, file)
  return !['CURRENTLY_LOADED', 'PREVIOUSLY_LOADED'].includes(
    availability.status
  )
}

export const yomichanActions: FileEventHandlers<YomichanDictionary> = {
  openRequest: async ({ file }, filePath, state, effects) => {
    try {
      // const availability = r.getFileAvailability(state, file)
      if (
        // !['CURRENTLY_LOADED', 'PREVIOUSLY_LOADED'].includes(availability.status)
        currentlyImporting(state, file)
      ) {
        await parseYomichanZip(file, filePath, effects)

        return [
          r.simpleMessageSnackbar('Your dictionary has finished importing!'),
          r.openFileSuccess(file, filePath),
        ]
      }

      return [r.openFileSuccess(file, filePath)]
    } catch (err) {
      console.error(err)
      return [r.openFileFailure(file, filePath, String(err))]
    }
  },
  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      // set last active dictionary
      // (effectively same thing as setting current active dictionary)
      const activeDictionaries = state.settings.activeDictionaries || []
      return [r.addActiveDictionary(validatedFile.id, validatedFile.type)]
    },
  ],

  locateRequest: async ({ file }, availability, state, effects) => {
    return []
  },

  locateSuccess: null,
  deleteRequest: [deleteRequest],
  deleteSuccess: [deleteSuccess],
}

export const dictCcActions: FileEventHandlers<DictCCDictionary> = {
  openRequest: async ({ file }, filePath, state, effects) => {
    // first look in indexeddb
    // then look in filesystem, parse, put into indexeddb

    // parseDictionaryFile(file, filePath, effects);
    console.log('parsing!', { file })
    return [r.openFileSuccess(file, filePath)]
  },
  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      // set last active dictionary
      // (effectively same thing as setting current active dictionary)
      return [r.addActiveDictionary(validatedFile.id, validatedFile.type)]
    },
  ],

  locateRequest: async ({ file }, availability, state, effects) => {
    return []
  },

  locateSuccess: null,
  deleteRequest: [deleteRequest],
  deleteSuccess: [deleteSuccess],
}

async function parseCedictZipOrU8TextFile(
  file: CEDictDictionary,
  filePath: string,
  effects: EpicsDependencies
) {
  if (extname(filePath).toLowerCase() === '.zip') {
    return new Promise((res, rej) => {
      return yauzl.open(filePath, { lazyEntries: true }, function(
        err,
        zipfile
      ) {
        if (err) return rej(err)
        if (!zipfile) throw new Error('problem reading zip file')
        zipfile.on('entry', function(entry) {
          if (/^cedict_ts\.u8$/.test(entry.fileName)) {
            console.log('match!')
            // file entry
            zipfile.openReadStream(entry, function(err, readStream) {
              if (err) return rej(err)
              if (!readStream)
                return rej(new Error('problem streaming zip file'))

              let rawText = ''
              readStream.on('data', data => {
                rawText += data.toString()
                console.log(data.toString())
              })

              readStream.on('end', function() {
                const entriesJSON: any[] = []
                const entries: LexiconEntry[] = []
                // [["ライフハックス","","n","",2,["life hack","life hacks"]
                for (const [
                  head,
                  pronunciation,
                  tags,
                  _,
                  frequencyScore,
                  meanings,
                ] of entriesJSON) {
                  const dictEntry: LexiconEntry = {
                    variant: false,
                    dictionaryId: +file.id,
                    head,
                    pronunciation,
                    tags,
                    frequencyScore,
                    meanings,
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
                  .catch(err => rej(err))
              })
            })
          } else {
            zipfile.readEntry()
          }
        })

        zipfile.on('close', () => {
          res()
        })

        zipfile.readEntry()
      })
    })
  }
}

export const ceDictActions: FileEventHandlers<CEDictDictionary> = {
  openRequest: async ({ file }, filePath, state, effects) => {
    // first look in indexeddb
    // then look in filesystem, parse, put into indexeddb
    if (currentlyImporting(state, file)) {
      await parseCedictZipOrU8TextFile(file, filePath, effects)
      console.log('parsing!', { file })
      return [
        r.simpleMessageSnackbar('Your dictionary has finished importing!'),
        r.openFileSuccess(file, filePath),
      ]
    }

    return [r.openFileSuccess(file, filePath)]
  },
  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      // set last active dictionary
      // (effectively same thing as setting current active dictionary)
      return [r.addActiveDictionary(validatedFile.id, validatedFile.type)]
    },
  ],

  locateRequest: async ({ file }, availability, state, effects) => {
    return []
  },

  locateSuccess: null,
  deleteRequest: [deleteRequest],
  deleteSuccess: [deleteSuccess],
}
