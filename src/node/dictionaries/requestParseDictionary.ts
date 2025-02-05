import type { BrowserWindow } from 'electron'
import { openDictionaryZip, readEntryData } from './openDictionaryZip'
import { failure, success } from '../../utils/result'
import type {
  YomitanArchiveEntry,
  YomitanArchiveEntryType,
} from '../../utils/dictionaries/importYomitanEntries'
import { getImageMediaTypeFromFileName } from '../../vendor/yomitan/ext/js/media/media-util'

export async function requestParseDictionary(
  file: DictionaryFile,
  filePath: string,
  mainWindow: BrowserWindow
): AsyncResult<{ file: DictionaryFile; entryCount: number }> {
  switch (file.dictionaryType) {
    case 'YomichanDictionary':
      return await requestParseYomichanDictionary(file, filePath, mainWindow)
    case 'CEDictDictionary':
      return await requestParseCedictDictionary(file, filePath, mainWindow)
    case 'DictCCDictionary':
      return await requestParseDictCcDictionary(file, filePath, mainWindow)
    case 'YomitanDictionary':
      return await requestParseYomitanDictionary(file, filePath, mainWindow)
  }
}

const LINE_BREAK = 0x0a

async function requestParseYomichanDictionary(
  file: YomichanDictionary,
  filePath: string,
  mainWindow: BrowserWindow
): AsyncResult<{ file: YomichanDictionary; entryCount: number }> {
  let termBankMet = false
  const startMoment = Date.now()

  return await openDictionaryZip({
    file,
    filePath,
    mainWindow,
    handleEntry: async (
      zipfile,
      entry,
      importProgressState,
      sendProgressUpdate
    ) => {
      if (!/term_bank_/.test(entry.fileName)) {
        return
      }
      termBankMet = true

      let entryData = ''

      await readEntryData({
        zipfile,
        entry,
        importProgressState,
        handleData: async (data) => {
          entryData += data
        },
        handleEnd: async () => {
          sendProgressUpdate(entryData)
        },
      })
    },
    handleClose(sendEndMessage) {
      const completionMoment = Date.now()
      const completionMinutes = (completionMoment - startMoment) / 1000 / 60
      sendEndMessage(
        termBankMet
          ? {
              value: `Dictionary parsed successfully in ${completionMinutes.toFixed(
                2
              )} minutes.`,
            }
          : failure('Invalid Yomichan dictionary file.')
      )
    },
  })
}

async function requestParseDictCcDictionary(
  file: DictCCDictionary,
  filePath: string,
  mainWindow: BrowserWindow
): AsyncResult<{ file: DictCCDictionary; entryCount: number }> {
  let validFileMet = false
  const startMoment = Date.now()

  let nextLineStart: number[] = []

  return await openDictionaryZip({
    file,
    filePath,
    mainWindow,
    handleEntry: async (
      zipfile,
      entry,
      importProgressState,
      sendProgressUpdate
    ) => {
      if (!/\.txt$/.test(entry.fileName)) {
        return
      }
      validFileMet = true

      await readEntryData({
        zipfile,
        entry,
        importProgressState,
        handleData: async (data) => {
          // const lastLineBreakIndex = getLastIndexOf(data, /[\n\r]/)
          const lastLineBreakIndex = data.lastIndexOf(LINE_BREAK)
          if (lastLineBreakIndex === -1) {
            nextLineStart.push(...data)
            return
          }
          const beforeLastLineBreak = Uint8Array.prototype.slice.call(
            data,
            0,
            lastLineBreakIndex
          )
          const afterLastLineBreak = Uint8Array.prototype.slice.call(
            data,
            lastLineBreakIndex + 1
          )

          const nextLineStartCombinedWithBeforeLastLineBreak: string =
            new TextDecoder().decode(new Uint8Array(nextLineStart)) +
            new TextDecoder().decode(beforeLastLineBreak)
          sendProgressUpdate(nextLineStartCombinedWithBeforeLastLineBreak)

          nextLineStart = Array.from(afterLastLineBreak)
        },
        handleEnd: async () => {
          sendProgressUpdate()
        },
      })
    },
    handleClose(sendEndMessage) {
      const completionMoment = Date.now()
      const completionMinutes = (completionMoment - startMoment) / 1000 / 60
      sendEndMessage(
        validFileMet
          ? {
              value: `Dictionary parsed successfully in ${completionMinutes.toFixed(
                2
              )} minutes.`,
            }
          : failure('Invalid dict.cc dictionary file.')
      )
    },
  })
}

async function requestParseCedictDictionary(
  file: CEDictDictionary,
  filePath: string,
  mainWindow: BrowserWindow
): AsyncResult<{ file: CEDictDictionary; entryCount: number }> {
  let validFileMet = false
  const startMoment = Date.now()

  let nextLineStart: number[] = []

  return await openDictionaryZip({
    file,
    filePath,
    mainWindow,
    handleEntry: async (
      zipfile,
      entry,
      importProgressState,
      sendProgressUpdate
    ) => {
      if (!/\.u8/.test(entry.fileName)) {
        return
      }
      validFileMet = true

      await readEntryData({
        zipfile,
        entry,
        importProgressState,
        handleData: async (data) => {
          // const lastLineBreakIndex = getLastIndexOf(data, /[\n\r]/)
          const lastLineBreakIndex = data.lastIndexOf(LINE_BREAK)
          if (lastLineBreakIndex === -1) {
            nextLineStart.push(...data)
            return
          }
          const beforeLastLineBreak = Uint8Array.prototype.slice.call(
            data,
            0,
            lastLineBreakIndex
          )
          const afterLastLineBreak = Uint8Array.prototype.slice.call(
            data,
            lastLineBreakIndex + 1
          )

          const nextLineStartCombinedWithBeforeLastLineBreak: string =
            new TextDecoder().decode(new Uint8Array(nextLineStart)) +
            new TextDecoder().decode(beforeLastLineBreak)
          sendProgressUpdate(nextLineStartCombinedWithBeforeLastLineBreak)

          nextLineStart = Array.from(afterLastLineBreak)
        },
        handleEnd: async () => {
          sendProgressUpdate()
        },
      })
    },
    handleClose(sendEndMessage) {
      const completionMoment = Date.now()
      const completionMinutes = (completionMoment - startMoment) / 1000 / 60
      sendEndMessage(
        validFileMet
          ? {
              value: `Dictionary parsed successfully in ${completionMinutes.toFixed(
                2
              )} minutes.`,
            }
          : failure('Invalid CEDict dictionary file.')
      )
    },
  })
}

function getYomitanArchiveEntryType(
  entryFileName: string
): YomitanArchiveEntryType | null {
  if (/^index.json$/i.test(entryFileName)) return 'index'
  if (/^term_bank_(\d+)\.json$/i.test(entryFileName)) return 'term_bank'
  if (/^term_meta_bank_(\d+)\.json$/i.test(entryFileName))
    return 'term_meta_bank'
  if (/^kanji_bank_(\d+)\.json$/i.test(entryFileName)) return 'kanji_bank'
  if (/^kanji_meta_bank_(\d+)\.json$/i.test(entryFileName))
    return 'kanji_meta_bank'
  if (/^tag_bank_(\d+)\.json$/i.test(entryFileName)) return 'tag_bank'
  if (/^styles.css/i.test(entryFileName)) return 'styles'
  if (getImageMediaTypeFromFileName(entryFileName)) return 'image'

  return null
}

async function requestParseYomitanDictionary(
  file: YomitanDictionary,
  filePath: string,
  mainWindow: BrowserWindow
): AsyncResult<{ file: YomitanDictionary; entryCount: number }> {
  let termBankMet = false
  const startMoment = Date.now()

  const indexJsonContents: Uint8Array[] = []
  await new Promise((res, rej) => {
    openDictionaryZip({
      file,
      filePath,
      mainWindow,
      handleEntry: async (zipfile, entry, importProgressState) => {
        if (entry.fileName === 'index.json') {
          await readEntryData({
            zipfile,
            entry,
            importProgressState,
            handleData: async (data) => {
              indexJsonContents.push(data)
            },
            handleEnd: async () => {},
          })
        }
      },
      handleClose() {
        res(null)
      },
    })
  })
  const indexJsonTextContent = new TextDecoder().decode(
    indexJsonContents.reduce((acc, data) => {
      const newLength = acc.length + data.length
      const newBuffer = new Uint8Array(newLength)
      newBuffer.set(acc)
      newBuffer.set(data, acc.length)
      return newBuffer
    }, new Uint8Array())
  )
  console.log({ indexJsonTextContent, indexJsonContents })
  let version: 1 | 2 | 3 = 3
  let title = ''
  try {
    const indexJsonParsed = JSON.parse(indexJsonTextContent) as
      | { format: number; version?: number; title: string }
      | { version: number; format?: number; title: string }
    const parsedVersion = indexJsonParsed.format ?? indexJsonParsed.version
    if (!parsedVersion || parsedVersion < 1 || parsedVersion > 3) {
      throw new Error('Invalid version number.')
    }
    version = parsedVersion as 1 | 2 | 3
    title = indexJsonParsed.title ?? ''
    console.log('Parsed index.json', indexJsonParsed)
  } catch (error) {
    console.error('Error parsing index.json', error)
    console.log('indexJsonTextContent', indexJsonTextContent)
  }

  return await openDictionaryZip<YomitanDictionary, YomitanArchiveEntry>({
    file,
    filePath,
    mainWindow,
    handleEntry: async (
      zipfile,
      entry,
      importProgressState,
      sendProgressUpdate
    ) => {
      const entryType = getYomitanArchiveEntryType(entry.fileName)
      console.log(`Handling ${entryType} entry`, entry.fileName)
      if (!entryType) return
      if (entryType === 'term_bank') termBankMet = true

      let entryData = new Uint8Array()

      await readEntryData({
        zipfile,
        entry,
        importProgressState,
        handleData: async (data) => {
          const newLength = entryData.length + data.length
          const newBuffer = new Uint8Array(newLength)
          newBuffer.set(entryData)
          newBuffer.set(data, entryData.length)
          entryData = newBuffer
        },
        handleEnd: async () => {
          const archiveEntryResult = getYomitanArchiveEntry(
            entry.fileName,
            entryType,
            version,
            file.id,
            entryData
          )
          if (!archiveEntryResult.error)
            sendProgressUpdate(archiveEntryResult.value)
        },
      })
    },
    handleClose(sendEndMessage) {
      const completionMoment = Date.now()
      const completionMinutes = (completionMoment - startMoment) / 1000 / 60
      sendEndMessage(
        termBankMet
          ? {
              value: `Dictionary parsed successfully in ${completionMinutes.toFixed(
                2
              )} minutes.`,
            }
          : failure('Invalid Yomitan dictionary file.')
      )
    },
  })
}
function getYomitanArchiveEntry(
  entryPath: string,
  entryType: YomitanArchiveEntryType,
  version: 1 | 2 | 3,
  dictionaryId: string,
  entryData: Uint8Array
): Result<YomitanArchiveEntry> {
  try {
    switch (entryType) {
      case 'term_bank':
      case 'term_meta_bank':
      case 'kanji_bank':
      case 'kanji_meta_bank':
      case 'tag_bank':
      case 'index':
        return success({
          dictionaryVersion: version,
          dictionaryId,
          data: {
            type: entryType,
            json: JSON.parse(new TextDecoder().decode(entryData)),
          },
        })
      case 'styles':
        return success({
          dictionaryVersion: version,
          dictionaryId,
          data: {
            type: 'styles',
            text: new TextDecoder().decode(entryData),
          },
        })
      case 'image': {
        const mediaType = getImageMediaTypeFromFileName(entryPath)
        if (!mediaType) throw new Error('Invalid image file.')
        return success({
          entryType: entryType,
          dictionaryVersion: version,
          dictionaryId,
          data: {
            type: 'image',
            content: entryData,
            mediaType,
            path: entryPath,
            dictionary: dictionaryId,
          },
        })
      }
    }
  } catch (error) {
    return failure(error)
  }
}
