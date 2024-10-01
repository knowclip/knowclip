import { BrowserWindow } from 'electron'
import { openDictionaryZip, readEntryData } from './openDictionaryZip'

export async function requestParseDictionary(
  file: DictionaryFile,
  filePath: string,
  mainWindow: BrowserWindow
) {
  switch (file.dictionaryType) {
    case 'YomichanDictionary':
      return await requestParseYomichanDictionary(file, filePath, mainWindow)
    case 'CEDictDictionary':
      return await requestParseCedictDictionary(file, filePath, mainWindow)
    case 'DictCCDictionary':
      return await requestParseDictCcDictionary(file, filePath, mainWindow)
  }
}

const LINE_BREAK = 0x0a

export async function requestParseYomichanDictionary(
  file: YomichanDictionary,
  filePath: string,
  mainWindow: BrowserWindow
): Promise<Result<{ file: YomichanDictionary; entryCount: number }>> {
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
          : {
              error: new Error('Invalid dictionary file.'),
            }
      )
    },
  })
}

export async function requestParseDictCcDictionary(
  file: DictCCDictionary,
  filePath: string,
  mainWindow: BrowserWindow
): Promise<Result<{ file: DictCCDictionary; entryCount: number }>> {
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
          : {
              error: new Error('Invalid dictionary file.'),
            }
      )
    },
  })
}

export async function requestParseCedictDictionary(
  file: CEDictDictionary,
  filePath: string,
  mainWindow: BrowserWindow
): Promise<Result<{ file: CEDictDictionary; entryCount: number }>> {
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
          : {
              error: new Error('Invalid dictionary file.'),
            }
      )
    },
  })
}
