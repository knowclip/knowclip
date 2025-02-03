import type { BrowserWindow } from 'electron'
import { Entry, ZipFile, open } from 'yauzl'
import { failure } from '../result'

export type ImportProgressPayload<
  D extends DictionaryFile,
  DataTransferType = string
> = {
  file: D
  filePath: string
  progressPercentage: number
  message: string
  data?: DataTransferType
}

export type ParseEndPayload<D extends DictionaryFile> =
  | {
      file: D
      filePath: string
      success: true
      message: string
    }
  | {
      file: D
      filePath: string
      success: false
      errors: string[]
    }

type ImportProgressState = {
  entryCount: number
  processedEntries: number
  currentEntryBytesProcessed: number
  currentEntryTotalBytes: number
}

export async function getIndexJsonFromZip(
  filePath: string
): AsyncResult<string> {
  try {
    const zipfile: ZipFile = await new Promise((res, rej) => {
      open(filePath, { lazyEntries: true }, function (err, zipfile) {
        if (err) return rej(err)
        if (!zipfile) return rej(new Error('problem reading zip file'))

        res(zipfile)
      })
    })

    let visitedEntries = 0

    return new Promise((res, rej) => {
      zipfile.on('entry', async (entry: Entry) => {
        const entryIndex = visitedEntries
        visitedEntries++
        try {
          if (entry.fileName === 'index.json') {
            let entryText = ''
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) return rej(err)
              if (!readStream)
                return rej(new Error('problem streaming zip file'))

              readStream.on('data', (data: Buffer) => {
                entryText += data.toString()
              })

              readStream.on('end', () => {
                zipfile.close()
                res({ value: entryText })
              })
            })
          } else {
            zipfile.readEntry()
          }
        } catch (error) {
          console.error('Error processing entry at index', entryIndex, error)
          zipfile.close()
        }
      })
      zipfile.on('close', () => {
        rej('index.json not found in zip')
      })

      zipfile.readEntry()
    })
  } catch (err) {
    return failure(`Problem opening zip file: ${err}`)
  }
}

export async function openDictionaryZip<
  DictionaryFileType extends DictionaryFile,
  DataTransferType = string
>({
  file,
  filePath,
  handleEntry,
  handleClose,
  mainWindow,
}: {
  file: DictionaryFileType
  filePath: string
  handleEntry: (
    zipFile: ZipFile,
    entry: Entry,
    progressState: ImportProgressState,
    sendProgressUpdate: (data?: DataTransferType) => void
  ) => void

  handleClose(sendEndResult: (result: Result<string>) => void): void
  mainWindow: BrowserWindow
}): Promise<Result<{ file: DictionaryFileType; entryCount: number }>> {
  try {
    const zipfile: ZipFile = await new Promise((res, rej) => {
      open(filePath, { lazyEntries: true }, function (err, zipfile) {
        if (err) return rej(err)
        if (!zipfile) return rej(new Error('problem reading zip file'))

        res(zipfile)
      })
    })

    let visitedEntries = 0

    const importProgressState: ImportProgressState = {
      entryCount: zipfile.entryCount,
      processedEntries: 0,
      currentEntryBytesProcessed: 0,
      currentEntryTotalBytes: 0,
    }

    zipfile.on('entry', async (entry: Entry) => {
      const entryIndex = visitedEntries
      visitedEntries++
      try {
        importProgressState.currentEntryTotalBytes = entry.uncompressedSize
        await handleEntry(
          zipfile,
          entry,
          importProgressState,
          (data?: DataTransferType) =>
            sendProgressUpdate(
              getProgressPercentage(importProgressState, zipfile),
              `Import in progress. Processing ${entry.fileName}`,
              data
            )
        )

        importProgressState.processedEntries++
        importProgressState.currentEntryBytesProcessed = 0
        zipfile.readEntry()
      } catch (error) {
        console.error('Error processing entry at index', entryIndex, error)
        zipfile.close()
      }
    })
    zipfile.on('close', () => {
      handleClose((result) => {
        const endEventPayload: ParseEndPayload<DictionaryFileType> =
          result.error
            ? {
                file,
                filePath,
                success: false,
                errors: ['Invalid dictionary file.'],
              }
            : {
                file,
                filePath,
                success: true,
                message: result.value,
              }
        console.log('Sending dictionary-parse-end event')
        mainWindow.webContents.send(
          'message',
          'dictionary-parse-end',
          endEventPayload
        )
      })
    })

    zipfile.readEntry()

    return {
      value: { file, entryCount: zipfile.entryCount },
    }

    // eslint-disable-next-line no-inner-declarations
    function sendProgressUpdate(
      progressPercentage: number,
      message: string,
      data?: DataTransferType
    ) {
      console.log(
        `Sending progress update: ${progressPercentage}% - ${message}`
      )
      mainWindow.webContents.send('message', 'dictionary-import-progress', {
        file,
        filePath,
        progressPercentage,
        message,
        data,
      })
    }
  } catch (err) {
    return failure(`Problem opening zip file: ${err}`)
  }
}

function getProgressPercentage(
  {
    entryCount,
    processedEntries,
    currentEntryBytesProcessed,
    currentEntryTotalBytes,
  }: ImportProgressState,
  zipfile: ZipFile
) {
  const processedEntriesProgress = processedEntries / entryCount
  const currentEntryProgress =
    currentEntryBytesProcessed / currentEntryTotalBytes
  const currentEntryWeightedProgress = currentEntryProgress * (1 / entryCount)
  console.log(processedEntries, zipfile.entryCount)
  return Number(processedEntries / entryCount) * 100
}

export async function readEntryData({
  zipfile,
  entry,
  importProgressState,
  handleData,
  handleEnd,
}: {
  zipfile: ZipFile
  entry: Entry
  importProgressState: ImportProgressState
  handleData: (data: Buffer) => void
  handleEnd: () => void
}) {
  importProgressState.currentEntryBytesProcessed = 0
  importProgressState.currentEntryTotalBytes = entry.uncompressedSize

  return new Promise((res, rej) => {
    zipfile.openReadStream(entry, (err, readStream) => {
      if (err) return rej(err)
      if (!readStream) return rej(new Error('problem streaming zip file'))

      readStream.on('data', (data: Buffer) => {
        importProgressState.currentEntryBytesProcessed += data.byteLength
        handleData(data)
      })

      readStream.on('end', () => {
        handleEnd()
        res(null)
      })
    })
  })
}
