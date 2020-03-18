import * as r from '../redux'
import { toTimestamp } from '../utils/ffmpeg'
import { extname, basename } from 'path'
import { unparse } from 'papaparse'
import { getNoteTypeFields } from '../utils/noteType'
import { getFileAvailability, encodeClozeDeletions } from '../selectors'
import { existsSync } from 'fs'
import { getVideoStillPngPath, getMidpoint } from './getVideoStill'
import { sanitizeFileName } from './sanitizeFilename'
import moment from 'moment'

const roughEscape = (text: string) => text.replace(/[\n\r]/g, '<br />')

const FRONT_SIDE = '{{FrontSide}}'
const HR = '<hr id="answer" />'
const TRANSCRIPTION = '<p class="transcription">{{transcription}}</p>'
const CLOZE_TRANSCRIPTION =
  '<p class="transcription">{{cloze:transcription}}</p>'
const MEANING = '<p class="meaning">{{meaning}}</p>'
const PRONUNCIATION = `{{#pronunciation}}
<p class="pronunciation">{{pronunciation}}
</p>
{{/pronunciation}}`
const NOTES = `{{#notes}}
<p class="notes">{{notes}}
</p>
{{/notes}}`
const IMAGE = `{{#image}}
<div class="image">{{image}}</div>
{{/image}}`
const TAGS = `{{#Tags}}
<div class="tags">{{Tags}}</div>
{{/Tags}}`

const LISTENING_CARD = {
  name: 'Listening',
  questionFormat: [IMAGE, `{{sound}}`].join('\n'),
  answerFormat: [
    FRONT_SIDE,
    HR,
    TRANSCRIPTION,
    PRONUNCIATION,
    MEANING,
    NOTES,
    TAGS,
  ].join('\n\n'),
}

export const CLOZE_QUESTION_FORMAT = [IMAGE, CLOZE_TRANSCRIPTION, MEANING].join(
  '\n\n'
)
export const CLOZE_ANSWER_FORMAT = [
  CLOZE_QUESTION_FORMAT,
  `{{sound}}`,
  HR,
  PRONUNCIATION,
  NOTES,
  TAGS,
].join('\n\n')

const getCards = (noteType: NoteType) => [LISTENING_CARD]

export const TEMPLATE_CSS = `.card {
  font-family: Helvetica, Arial;
  font-size: 16px;
  text-align: center;
  color: black;
  background-color: white;
  line-height: 1.25
}

.transcription {
  font-size: 2em;
}

.pronunciation {
  font-style: italic;
  font-size: 1.4em;
}

.meaning {
  margin-top: 4em;
  margin-bottom: 4em;
}

.notes {
  background-color: #efefef;
  padding: .8em;
  border-radius: .2em;
  text-align: justify;
  max-width: 40em;
  margin-left: auto;
  margin-right: auto;
}

.tags {
  color: #999999;
  font-size: .8em;
}
`

/** Returns either valid export data or a list of missing media files. */
export const getApkgExportData = (
  state: AppState,
  project: ProjectFile,
  mediaIdToClipsIds: ReviewAndExportDialogData['mediaFileIdsToClipIds']
) => {
  const fieldNames = getNoteTypeFields(project.noteType)
  const mediaFiles = r.getProjectMediaFiles(state, project.id)

  const missingMediaFiles = mediaFiles.filter(mediaFile => {
    if (!mediaIdToClipsIds[mediaFile.id].length) return false

    const fileLoaded = getFileAvailability(state, mediaFile)
    return (
      !fileLoaded || !fileLoaded.filePath || !existsSync(fileLoaded.filePath)
    )
  })
  if (missingMediaFiles.length > 0) return { missingMediaFiles }

  const clipSpecs: ClipSpecs[] = []

  for (const mediaFileId in mediaIdToClipsIds) {
    const clipIds = mediaIdToClipsIds[mediaFileId]
    if (!clipIds.length) continue

    const media = r.getFile<MediaFile>(
      state,
      'MediaFile',
      mediaFileId
    ) as MediaFile

    const fileLoaded = getFileAvailability(state, media)
    if (!fileLoaded.filePath)
      throw new Error(`Please open ${media.name} and try again.`)

    for (const id of clipIds) {
      if (!id) continue

      const clip = r.getClip(state, id)
      const flashcard = r.getFlashcard(state, id)
      if (!clip) throw new Error('Could not find clip ' + id)
      if (!flashcard) throw new Error('Could not find flashcard ' + id)

      const extension = extname(fileLoaded.filePath)
      const filenameWithoutExtension = basename(fileLoaded.filePath, extension)

      const startTime = r.getMillisecondsAtX(state, clip.start)
      const endTime = r.getMillisecondsAtX(state, clip.end)
      const outputFilename =
        sanitizeFileName(
          `${filenameWithoutExtension.slice(0, 20)}__${media.id}`
        ) +
        `__${toTimestamp(startTime, '!', '!')}_${toTimestamp(
          endTime,
          '!',
          '!'
        )}.mp3`

      const getSeconds = (seconds?: number) =>
        typeof seconds === 'number'
          ? seconds
          : +(getMidpoint(startTime, endTime) / 1000).toFixed(3)

      clipSpecs.push({
        sourceFilePath: fileLoaded.filePath,
        startTime,
        endTime,
        outputFilename,
        flashcardSpecs: {
          id: clip.id,
          fields: [
            ...Object.values(flashcard.fields).map(roughEscape),
            `[sound:${outputFilename}]`,
            flashcard.image
              ? `<img src="${basename(
                  getVideoStillPngPath(
                    flashcard.image.id,
                    fileLoaded.filePath,
                    getSeconds(flashcard.image.seconds)
                  )
                )}" />`
              : '',
          ],
          tags: flashcard.tags.map(t => t.replace(/\s+/g, '_')).join(' '),
          image: flashcard.image
            ? {
                id: flashcard.image.id,
                seconds: getSeconds(flashcard.image.seconds),
              }
            : null,

          clozeDeletions: flashcard.cloze.length
            ? roughEscape(
                encodeClozeDeletions(
                  flashcard.fields.transcription,
                  flashcard.cloze
                )
              )
            : undefined,
        },
      })
    }
  }

  const projectId = moment(project.createdAt).valueOf()

  const deckName = `${project.name} (Generated by Knowclip)`
  const finalFieldNames = [...fieldNames, 'sound', 'image']
  const fields = finalFieldNames.map(fn => ({ name: fn }))

  const exportData: ApkgExportData = {
    clips: clipSpecs,
    projectId,
    deckName,
    noteModel: {
      name: `Audio note (${project.name})`,
      id: projectId + 1,
      flds: fields,
      req: getCards(project.noteType).map((t, i) => [
        i,
        'all',
        [finalFieldNames.indexOf('sound')],
      ]),
      css: TEMPLATE_CSS,
      tmpls: getCards(project.noteType).map(template => ({
        name: template.name,
        qfmt: template.questionFormat,
        afmt: template.answerFormat,
      })),
    },
    clozeNoteModel: {
      id: projectId + 2,
      name: `Cloze (${project.name})`,
      flds: fields,
      css: TEMPLATE_CSS,
      tmpl: {
        name: 'Cloze',
        qfmt: CLOZE_QUESTION_FORMAT,
        afmt: CLOZE_ANSWER_FORMAT,
      },
    },
  }
  return exportData
}

export const getCsvText = (exportData: ApkgExportData) => {
  const csvData: string[][] = []
  const clozeCsvData: string[][] = []
  for (const {
    flashcardSpecs: { fields, tags, clozeDeletions },
  } of exportData.clips) {
    csvData.push([...fields, tags])
    if (clozeDeletions) {
      clozeCsvData.push([clozeDeletions, ...fields.slice(1), tags])
    }
  }

  return {
    csvText: unparse(csvData),
    clozeCsvText: clozeCsvData.length ? unparse(clozeCsvData) : null,
  }
}
