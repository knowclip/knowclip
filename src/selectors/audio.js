// @flow
import { basename } from 'path'

export const getFilePaths = (state: AppState) => state.audio.filesOrder
export const isLoopOn = (state: AppState) => state.audio.loop
export const areFilesLoaded = (state: AppState) =>
  Boolean(state.audio.filesOrder.length)
export const isNextButtonEnabled = (state: AppState) =>
  Boolean(state.audio.filesOrder.length > 1) &&
  state.audio.currentFileIndex !== state.audio.filesOrder.length - 1
export const isPrevButtonEnabled = (state: AppState) =>
  Boolean(state.audio.filesOrder.length > 1) &&
  state.audio.currentFileIndex !== 0
export const getCurrentFileIndex = (state: AppState) =>
  state.audio.currentFileIndex
export const getCurrentFileName = (state: AppState): ?AudioFileName => {
  const filePath = getCurrentFilePath(state)
  return filePath && basename(filePath)
}

export const getAudioFile = (
  state: AppState,
  id: AudioFileId
): ?AudioFileData => {
  const file = state.audio.files[id]
  return file || null
}

export const getAudioFilePath = (
  state: AppState,
  id: AudioFileId
): ?AudioFilePath => {
  const file = getAudioFile(state, id)
  return file ? file.path : null
}

export const getCurrentFileId = ({ audio }: AppState): ?AudioFileId =>
  audio.filesOrder[audio.currentFileIndex]

export const getCurrentFile = (state: AppState): ?AudioFileData => {
  const currentFileId = getCurrentFileId(state)
  return currentFileId ? state.audio.files[currentFileId] : null
}
export const getCurrentFilePath = (state: AppState): ?AudioFilePath => {
  const currentFile = getCurrentFile(state)
  return currentFile ? currentFile.path : null
}
export const getClipsOrder = (state: AppState): Array<ClipId> => {
  const currentFileId = getCurrentFileId(state)
  return currentFileId ? state.clips.idsByAudioFileId[currentFileId] : []
}

export const doesFileHaveClips = (
  state: AppState,
  fileId: AudioFileId
): boolean => {
  return Boolean(state.clips.idsByAudioFileId[fileId].length)
}

export const doesCurrentFileHaveClips = (state: AppState): boolean => {
  const currentFileId = getCurrentFileId(state)
  return Boolean(
    currentFileId && state.clips.idsByAudioFileId[currentFileId].length
  )
}

export const getCurrentNoteType = (state: AppState): ?NoteType => {
  const currentFile = getCurrentFile(state)

  const currentNoteTypeId = currentFile
    ? currentFile.noteTypeId
    : state.noteTypes.defaultId
  return currentNoteTypeId ? state.noteTypes.byId[currentNoteTypeId] : null
}
