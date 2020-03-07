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
  questionFormat: [IMAGE, `♫{{sound}}`].join('\n'),
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
  clipIds: ReviewAndExportDialogData['mediaIdsToClipsIds']
) => {
  const fieldNames = getNoteTypeFields(project.noteType)
  const mediaFiles = r.getProjectMediaFiles(state, project.id)

  const missingMediaFiles = mediaFiles.filter(mediaFile => {
    if (!clipIds[mediaFile.id].length) return false

    const fileLoaded = getFileAvailability(state, mediaFile)
    return (
      !fileLoaded || !fileLoaded.filePath || !existsSync(fileLoaded.filePath)
    )
  })
  if (missingMediaFiles.length > 0) return { missingMediaFiles }

  const clips = Object.entries(clipIds).flatMap(
    ([mediaFileId, clipIds], i): ClipSpecs[] => {
      const media = r.getFile<MediaFile>(
        state,
        'MediaFile',
        mediaFileId
      ) as MediaFile
      const clipSpecs: ClipSpecs[] = []
      for (const id of clipIds) {
        if (!id) continue

        const clip = r.getClip(state, id)
        const flashcard = r.getFlashcard(state, id)
        if (!clip) throw new Error('Could not find clip ' + id)
        if (!flashcard) throw new Error('Could not find flashcard ' + id)

        const fileLoaded = getFileAvailability(state, media)
        if (!fileLoaded.filePath)
          // verified existent via missingMediaFiles above
          throw new Error(`Please open ${media.name} and try again.`)
        const extension = extname(fileLoaded.filePath)
        const filenameWithoutExtension = basename(
          fileLoaded.filePath,
          extension
        )

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

        const fieldValues = Object.values(flashcard.fields).map(roughEscape)

        const image = flashcard.image
          ? `<img src="${basename(
              getVideoStillPngPath(
                flashcard.image.id,
                fileLoaded.filePath,
                typeof flashcard.image.seconds === 'number'
                  ? flashcard.image.seconds
                  : +(getMidpoint(startTime, endTime) / 1000).toFixed(3)
              )
            )}" />`
          : ''

        clipSpecs.push({
          sourceFilePath: fileLoaded.filePath,
          startTime,
          endTime,
          outputFilename,
          flashcardSpecs: {
            id: clip.id,
            fields: [...fieldValues, `[sound:${outputFilename}]`, image],
            tags: flashcard.tags.map(t => t.replace(/\s+/g, '_')).join(' '),
            image: flashcard.image || null,
            clozeDeletions: flashcard.cloze.length
              ? encodeClozeDeletions(
                  flashcard.fields.transcription,
                  flashcard.cloze
                )
              : undefined,
          },
        })
      }
      return clipSpecs
    }
  )

  const projectId = moment(project.createdAt).valueOf()

  const exportData: ApkgExportData = {
    projectId,
    noteModelId: projectId + 1,
    clozeModelId: projectId + 2,
    deckName: `${project.name} (Generated by Knowclip)`,
    template: {
      sortField: fieldNames.indexOf('transcription'),

      fields: [...fieldNames, 'sound', 'image'],
      cards: getCards(project.noteType),
      css: TEMPLATE_CSS,
    },
    clips,
  }
  return exportData
}

export const getCsvText = (exportData: ApkgExportData) => {
  const csvData = exportData.clips.map(({ flashcardSpecs }) => [
    ...flashcardSpecs.fields,
    flashcardSpecs.tags,
    flashcardSpecs.id,
  ])

  return unparse(csvData)
}
