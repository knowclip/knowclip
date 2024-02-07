import A from '../types/ActionType'
import { defineActionCreators } from './defineActionCreators'
import { filesActions } from './files'

export const projectActions = defineActionCreators({
  createProject: (
    id: string,
    name: string,
    noteType: NoteType,
    filePath: string,
    now: string
  ) => {
    const project: ProjectFile = {
      type: 'ProjectFile',
      id,
      name,
      noteType,
      mediaFileIds: [],
      error: null,
      createdAt: now,
      lastSaved: now,
    }

    return {
      type: A.createProject,
      project,
      filePath,
    }
  },
  openProjectRequestByFilePath: (filePath: string) => ({
    type: A.openProjectRequestByFilePath,
    filePath,
  }),

  openProjectRequestById: (id: ProjectId) => ({
    type: A.openProjectRequestById,
    id,
  }),

  openProject: (
    project: ProjectFile,
    clips: Clip[],
    now: string,
    flashcards: FlashcardsState
  ) => ({
    type: A.openProject,
    project,
    clips,
    flashcards,
    now,
  }),

  closeProject: () => ({
    type: A.closeProject,
  }),

  closeProjectRequest: () => ({
    type: A.closeProjectRequest,
  }),

  addMediaToProjectRequest: (
    projectId: ProjectId,
    filePaths: Array<MediaFilePath>
  ) => ({
    type: A.addMediaToProjectRequest,
    projectId,
    filePaths,
  }),

  saveProjectRequest: () => ({
    type: A.saveProjectRequest,
  }),

  saveProjectAsRequest: () => ({
    type: A.saveProjectAsRequest,
  }),

  setWorkIsUnsaved: (workIsUnsaved: boolean) => ({
    type: A.setWorkIsUnsaved,
    workIsUnsaved,
  }),
})

function update<F extends keyof FileUpdates>(u: FileUpdate<F>) {
  return u as unknown as FileUpdate<keyof FileUpdates>
}

const setProjectName = (id: ProjectId, name: string) =>
  filesActions.updateFile(
    update({
      id,
      fileType: 'ProjectFile',
      updateName: 'setProjectName',
      updatePayload: [name],
    })
  )
const deleteMediaFromProject = (
  projectId: ProjectId,
  mediaFileId: MediaFileId
) =>
  filesActions.updateFile({
    fileType: 'ProjectFile',
    id: projectId,
    updateName: 'deleteProjectMedia',
    updatePayload: [mediaFileId],
  })

export const compositeProjectActions = {
  setProjectName,
  deleteMediaFromProject,
}
