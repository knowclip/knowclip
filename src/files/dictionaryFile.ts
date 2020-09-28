import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import * as yauzl from 'yauzl'

export type LexiconEntry = LexiconMainEntry | LexiconVariantEntry
export type LexiconMainEntry = {
  variant: false
  dictionaryId: FileId
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
    dictionaryId: FileId
    head: string
    mainEntry: string
  }

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
                string[]
              ][]
              const entries: LexiconEntry[] = []
              // [["ライフハックス","","n","",2,["life hack","life hacks"]
              for (const [
                head,
                pronunciation,
                pos,
                _,
                frequencyScore,
                meanings,
              ] of entriesJSON) {
                const dictEntry: LexiconEntry = {
                  variant: false,
                  dictionaryId: file.id,
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
                .table('entries')
                .bulkAdd(entries)
                .then(() => {
                  zipfile.readEntry()
                })
                .catch(err => rej(err))
            })
          })
        } else {
          console.log('NO MATCH')
        }
      })

      zipfile.on('close', () => {
        res()
      })

      zipfile.readEntry()
    })
  })
}

export const yomichanActions: FileEventHandlers<YomichanDictionary> = {
  openRequest: async ({ file }, filePath, state, effects) => {
    try {
      const availability = r.getFileAvailability(state, file)
      if (
        !['CURRENTLY_LOADED', 'PREVIOUSLY_LOADED'].includes(availability.status)
      )
        await parseYomichanZip(file, filePath, effects)

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
      return [
        r.overrideSettings({
          activeDictionaries: activeDictionaries.find(
            d => d.id === validatedFile.id
          )
            ? activeDictionaries
            : [
                ...activeDictionaries,
                { id: validatedFile.id, type: validatedFile.type },
              ],
        }),
      ]
    },
  ],

  locateRequest: async ({ file }, availability, state, effects) => {
    return []
  },

  locateSuccess: null,
  deleteRequest: [
    async (file, availability, descendants, state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [
    async ({ file }, state) => [
      r.overrideSettings({
        activeDictionaries: (state.settings.activeDictionaries || []).filter(
          d => d.id !== file.id
        ),
      }),
    ],
  ],
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
      return []
    },
  ],

  locateRequest: async ({ file }, availability, state, effects) => {
    return []
  },

  locateSuccess: null,
  deleteRequest: [
    async (file, availability, descendants, state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [],
}

export const ceDictActions: FileEventHandlers<CEDictDictionary> = {
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
      return []
    },
  ],

  locateRequest: async ({ file }, availability, state, effects) => {
    return []
  },

  locateSuccess: null,
  deleteRequest: [
    async (file, availability, descendants, state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [],
}
