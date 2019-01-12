import { unparse } from 'papaparse'
import * as r from '../selectors'

const getCsvText = state => {
  const filePaths = state.audio.filesOrder
  const clipsAndCards = []
  filePaths.forEach(filePath => {
    const currentClips = Object.values(state.clips.byId).filter(
      c => c.filePath === filePath
    )
    currentClips.forEach(clip => {
      clipsAndCards.push({ clip, flashcard: state.flashcards[clip.id] })
    })
  })
  const csvData = clipsAndCards.reduce((rows, { clip, flashcard }) => {
    rows.push([
      flashcard.de,
      flashcard.en,
      `[sound:${r.getClipFilename(state, clip.id)}]`,
    ])
    return rows
  }, [])

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
