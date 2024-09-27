import { open, ZipFile, Entry } from 'yauzl'
import type { Readable } from 'stream'
import { BrowserWindow } from 'electron'

export type ImportProgressPayload = {
  file: YomichanDictionary
  filePath: string
  progressPercentage: number
  message: string
  data?: string
}

export type ParseEndPayload =
  | {
      file: YomichanDictionary
      filePath: string
      completionMoment: number
      success: true
    }
  | {
      file: YomichanDictionary
      filePath: string
      completionMoment: number
      success: false
      errors: string[]
    }

export async function requestParseYomichanDictionary(
  file: YomichanDictionary,
  filePath: string,
  mainWindow: BrowserWindow
): Promise<Result<{ file: YomichanDictionary; entryCount: number }>> {
  try {
    let termBankMet = false
    const zipfile: ZipFile = await new Promise((res, rej) => {
      open(filePath, { lazyEntries: true }, function (err, zipfile) {
        if (err) return rej(err)
        if (!zipfile) return rej(new Error('problem reading zip file'))

        res(zipfile)
      })
    })

    let visitedEntries = 0
    let progressPercentage = 0

    zipfile.on('entry', handleEntry)
    zipfile.on('close', handleClose)

    zipfile.readEntry()

    return {
      value: { file, entryCount: zipfile.entryCount },
    }

    // eslint-disable-next-line no-inner-declarations
    async function handleEntry(entry: Entry) {
      const entryIndex = visitedEntries
      visitedEntries++

      let entryJsonString = ''

      if (!/term_bank_/.test(entry.fileName)) {
        zipfile.readEntry()
        return
      }
      termBankMet = true

      try {
        const entryReadStream: Readable = await new Promise((res, rej) => {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) return rej(err)
            if (!readStream) return rej(new Error('problem streaming zip file'))

            res(readStream)
          })
        })

        let entryBytesProcessed = 0
        const { uncompressedSize: entryTotalBytes } = entry
        entryReadStream.on('data', (data) => {
          entryJsonString += data.toString()

          entryBytesProcessed += data.length

          const newZipfileProgressPercentage = getProgressPercentage(
            zipfile.entryCount,
            visitedEntries,
            entryBytesProcessed,
            entryTotalBytes
          )
          if (newZipfileProgressPercentage !== progressPercentage) {
            progressPercentage = newZipfileProgressPercentage
            mainWindow.webContents.send(
              'message',
              'dictionary-import-progress',
              {
                file,
                filePath,
                message: 'Import in progress.',
                progressPercentage,
              } satisfies ImportProgressPayload
            )
          }
        })

        entryReadStream.on('end', () => {
          mainWindow.webContents.send('message', 'dictionary-import-progress', {
            file,
            filePath,
            progressPercentage,
            message: 'Import in progress. Parsing entries...',
          })
          mainWindow.webContents.send('message', 'dictionary-import-progress', {
            file,
            filePath,
            progressPercentage,
            message: 'Import in progress.',
            data: entryJsonString,
          })
          zipfile.readEntry()
        })
      } catch (err) {
        console.error('Error reading entry at index', entryIndex)
      }
    }

    // eslint-disable-next-line no-inner-declarations
    function handleClose() {
      const completionMoment = Date.now()

      const endEventPayload: ParseEndPayload = termBankMet
        ? {
            file,
            filePath,
            completionMoment,
            success: true,
          }
        : {
            file,
            filePath,
            completionMoment,
            success: false,
            errors: ['Invalid dictionary file.'],
          }

      mainWindow.webContents.send(
        'message',
        'dictionary-parse-end',
        endEventPayload
      )
    }
  } catch (err) {
    console.error(err)
    return {
      errors: [`Problem opening zip file: ${err}`],
    }
  }
}

function getProgressPercentage(
  totalEntries: number,
  processedEntries: number,
  currentEntryBytesProcessed: number,
  currentEntryTotalBytes: number
) {
  const processedEntriesProgress = processedEntries / totalEntries
  const currentEntryProgress =
    currentEntryBytesProcessed / currentEntryTotalBytes
  const currentEntryWeightedProgress = currentEntryProgress * (1 / totalEntries)
  return (
    Number(
      (processedEntriesProgress + currentEntryWeightedProgress).toFixed(2)
    ) * 100
  )
}
