import sql from 'better-sqlite3'
import type { Database } from 'better-sqlite3'
import archiver from 'archiver'
// @ts-expect-error no types
import * as anki from '@silvestre/mkanki'
import type { AnkiNoteMedia } from '../utils/ankiNote'
import { getClipMedia } from './getClipMedia'
import { createWriteStream, existsSync } from 'fs'
import * as tempy from 'tempy'
import { BrowserWindow } from 'electron'
import { APKG_CREATION_EVENTS } from '../utils/apkgCreationEvents'

const tmpFilename = () => tempy.temporaryFile()

interface AnkiPackage {
  write(db: Database): void
  media: Array<{
    filename: string
    name: string
    data: Buffer
  }>
}

export const getWriteApkgDeck = (mainWindow: BrowserWindow) => {
  return async function writeApkgDeck(
    outputFilePath: string,
    exportData: ApkgExportData
  ) {
    try {
      const tmpDirectory = tempy.temporaryDirectory()
      const pkg = new anki.Package()
      const deck = new anki.Deck(exportData.projectId, exportData.deckName)
      const noteModel = new anki.Model(exportData.noteModel)
      const clozeNoteModel = new anki.ClozeModel(exportData.clozeNoteModel)

      mainWindow.webContents.send(
        'message',
        APKG_CREATION_EVENTS.deckInitialized
      )

      await Promise.all(
        exportData.clips.map(async (clipSpecs: ClipSpecs) => {
          registerClip(deck, noteModel, clozeNoteModel, clipSpecs)
          mainWindow.webContents.send(
            'message',
            APKG_CREATION_EVENTS.clipProcessed
          )

          const noteMediaResult = await getClipMedia(clipSpecs, tmpDirectory)
          if (noteMediaResult.error) throw noteMediaResult.error

          const noteMedia = noteMediaResult.value
          await addNoteMedia(pkg, noteMedia)
        })
      )

      mainWindow.webContents.send('message', APKG_CREATION_EVENTS.savingDeck)

      pkg.addDeck(deck)
      const archive = archiver('zip')
      const tempFilename = tmpFilename()

      await new Promise((res, rej) => {
        archive.on('error', (err) => {
          console.error(`Problem with archive!`)
          console.error(err)
          rej(err)
        })

        archive.on('close', res)
        archive.on('end', res)
        archive.on('finish', res)

        writeToApkg(pkg, outputFilePath, {
          db: sql(tempFilename),
          tmpFilename: tempFilename,
          archive,
        })
      })
    } catch (err) {
      mainWindow.webContents.send(
        'message',
        APKG_CREATION_EVENTS.deckCreationError,
        String(err)
      )

      throw err
    }

    mainWindow.webContents.send('message', APKG_CREATION_EVENTS.deckSaved)
  }
}

export function writeToApkg(
  ankiPackage: AnkiPackage,
  filename: string,
  {
    db,
    tmpFilename,
    archive,
  }: { db: Database; tmpFilename: string; archive: archiver.Archiver }
) {
  ankiPackage.write(db)
  db.close()
  const out = createWriteStream(filename)
  archive.pipe(out)

  if (!existsSync(tmpFilename)) throw new Error('Problem creating db')

  archive.file(tmpFilename, { name: 'collection.anki2' })
  const media_info: { [i: string]: string } = {}
  ankiPackage.media.forEach((m, i) => {
    if (m.filename != null) archive.file(m.filename, { name: i.toString() })
    else archive.append(m.data, { name: i.toString() })
    media_info[i] = m.name
  })
  archive.append(JSON.stringify(media_info), { name: 'media' })
  archive.finalize()
}

function registerClip(
  deck: any,
  noteModel: any,
  clozeNoteModel: any,
  clipSpecs: ClipSpecs
) {
  const {
    flashcardSpecs: { fields, tags, id, clozeDeletions },
  } = clipSpecs

  const note = { fields, guid: id, tags }
  const clozeNote = clozeDeletions
    ? {
        fields: [clozeDeletions, ...fields.slice(1)],
        guid: `${id}__CLOZE`,
        tags,
      }
    : null

  deck.addNote(noteModel.note(note.fields, note.guid, note.tags))
  if (clozeNote)
    deck.addNote(
      clozeNoteModel.note(clozeNote.fields, clozeNote.guid, clozeNote.tags)
    )
}

async function addNoteMedia(pkg: any, noteMedia: AnkiNoteMedia) {
  const { soundData, imageData } = noteMedia
  pkg.addMedia(await soundData.data(), soundData.fileName)
  if (imageData) pkg.addMedia(await imageData.data(), imageData.fileName)
}
