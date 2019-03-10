// @flow
import { unparse } from 'papaparse'
import * as r from '../selectors'

export const getAllClips = (state: AppState) => {
  const fileIds = state.audio.filesOrder
  const clips: Array<Clip> = []
  fileIds.forEach(fileId => {
    const currentFile: AudioFileData = state.audio.files[fileId]
    const currentNoteType = r.getNoteType(state, currentFile.noteTypeId)
    if (!currentNoteType) throw new Error(`No note type found for ${fileId}`)
    const currentClips: Array<Clip> = state.clips.idsByAudioFileId[fileId].map(
      clipId => {
        const clip = r.getClip(state, clipId)
        if (!clip) throw new Error(`clip ${clipId} for ${fileId} not found`)
        return clip
      }
    )
    currentClips.forEach(clip => {
      clips.push(clip)
    })
  })
  return clips
}

const getCsvText = (state: AppState) => {
  const fileIds = state.audio.filesOrder
  const csvData: Array<Array<string>> = []
  fileIds.forEach(fileId => {
    const currentFile: AudioFileData = state.audio.files[fileId]
    const currentNoteType = r.getNoteType(state, currentFile.noteTypeId)
    if (!currentNoteType) throw new Error(`No note type found for ${fileId}`)
    const currentClips: Array<Clip> = state.clips.idsByAudioFileId[fileId].map(
      clipId => {
        const clip = r.getClip(state, clipId)
        if (!clip) throw new Error(`clip ${clipId} for ${fileId} not found`)
        return clip
      }
    )
    currentClips.forEach(clip => {
      const fieldsValues = currentNoteType.fields.map(
        ({ id }) => clip.flashcard.fields[id]
      )
      console.log(fieldsValues)
      csvData.push(
        [
          clip.id,
          ...fieldsValues,
          `[sound:${r.getClipFilename(state, clip.id)}]`,
        ].concat(
          currentNoteType.useTagsField ? clip.flashcard.tags.join(' ') : []
        )
      )
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
