import A from '../types/ActionType'
import { filesActions } from './files'

const updateFile = filesActions.updateFile

export const projectActions = {
  [A.createProject]: (
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
  [A.openProjectRequestByFilePath]: (filePath: string) => ({
    type: A.openProjectRequestByFilePath,
    filePath,
  }),

  [A.openProjectRequestById]: (id: ProjectId) => ({
    type: A.openProjectRequestById,
    id,
  }),

  [A.openProject]: (
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

  [A.closeProject]: () => ({
    type: A.closeProject,
  }),

  [A.closeProjectRequest]: () => ({
    type: A.closeProjectRequest,
  }),

  [A.addMediaToProjectRequest]: (
    projectId: ProjectId,
    filePaths: Array<MediaFilePath>
  ) => ({
    type: A.addMediaToProjectRequest,
    projectId,
    filePaths,
  }),

  [A.saveProjectRequest]: () => ({
    type: A.saveProjectRequest,
  }),

  [A.saveProjectAsRequest]: () => ({
    type: A.saveProjectAsRequest,
  }),

  [A.setWorkIsUnsaved]: (workIsUnsaved: boolean) => ({
    type: A.setWorkIsUnsaved,
    workIsUnsaved,
  }),
}

function update<F extends keyof FileUpdates>(u: FileUpdate<F>) {
  return (u as any) as FileUpdate<keyof FileUpdates>
}

const setProjectName = (id: ProjectId, name: string) =>
  updateFile(
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
  updateFile({
    fileType: 'ProjectFile',
    id: projectId,
    updateName: 'deleteProjectMedia',
    updatePayload: [mediaFileId],
  })

export const compositeProjectActions = {
  setProjectName,
  deleteMediaFromProject,
}
