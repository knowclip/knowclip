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
export const getCurrentFileName = (state: AppState) => {
  const filePath = getCurrentFilePath(state)
  return filePath && basename(filePath)
}

export const getCurrentFilePath = ({ audio }: AppState): ?AudioFilePath =>
  audio.filesOrder[audio.currentFileIndex]

export const getCurrentFile = (state: AppState): ?AudioFileData => {
  const currentFilePath = getCurrentFilePath(state)
  return currentFilePath ? state.audio.files[currentFilePath] : null
}
export const getWaveformSelectionsOrder = (state: AppState): Array<ClipId> => {
  const currentFilePath = getCurrentFilePath(state)
  return currentFilePath ? state.clips.idsByFilePath[currentFilePath] : []
}

export const doesCurrentFileHaveClips = (state: AppState): boolean => {
  const currentFilePath = getCurrentFilePath(state)
  const clips = (Object.values(state.clips.byId): any)
  return currentFilePath
    ? clips.some((clip: Clip) => clip.filePath === currentFilePath)
    : false
}

export const getCurrentNoteType = (state: AppState): ?NoteType => {
  const currentFile = getCurrentFile(state)

  const currentNoteTypeId = currentFile
    ? currentFile.noteTypeId
    : state.noteTypes.defaultId
  return currentNoteTypeId ? state.noteTypes.byId[currentNoteTypeId] : null
}
