// @flow
import { unparse } from 'papaparse'
import * as r from '../selectors'

const getCsvText = (state: AppState) => {
  const filePaths = state.audio.filesOrder
  const csvData: Array<Array<string>> = []
  filePaths.forEach(filePath => {
    const currentFile: AudioFileData = state.audio.files[filePath]
    const currentNoteType = r.getNoteType(state, currentFile.noteTypeId)
    if (!currentNoteType) throw new Error(`No note type found for ${filePath}`)
    const currentClips: Array<Clip> = state.clips.idsByFilePath[filePath].map(
      clipId => {
        const clip = r.getWaveformSelection(state, clipId)
        if (!clip) throw new Error(`clip ${clipId} for ${filePath} not found`)
        return clip
      }
    )
    currentClips.forEach(clip => {
      const fieldsValues = currentNoteType.fields.map(
        ({ id }) => clip.flashcard.fields[id]
      )
      console.log(fieldsValues)
      csvData.push([
        ...fieldsValues,
        `[sound:${r.getClipFilename(state, clip.id)}]`,
      ])
    })
  })

  return unparse(csvData)
}

// web
// const exportCsv = (files, flashcards) => {
//   const usableFlashcards = files
//     .map(file => flashcards[file.name])
//     .filter(({ de, en }) => de.trim() || en.trim())
//     .map(({ en, de }, i) => [de, en, `[sound:${files[i].name}]`])
//   // TODO: alert if no usable
//   let csv = unparse(usableFlashcards)
//   const filename = 'export.csv'
//
//   if (!csv.match(/^data:text\/csv/i)) {
//     csv = 'data:text/csv;charset=utf-8,' + csv
//   }
//   const data = encodeURI(csv)
//
//   const link = document.createElement('a')
//   link.setAttribute('href', data)
//   link.setAttribute('download', filename)
//   link.click()
// }

export default getCsvText
