import A from '../types/ActionType'
import { filesActions } from './files'
export const projectActions = {
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
      type: A.createProject as const,
      project,
      filePath,
    }
  },
  openProjectRequestByFilePath: (filePath: string) => ({
    type: A.openProjectRequestByFilePath as const,
    filePath,
  }),

  openProjectRequestById: (id: ProjectId) => ({
    type: A.openProjectRequestById as const,
    id,
  }),

  openProject: (
    project: ProjectFile,
    clips: Clip[],
    now: string,
    flashcards: FlashcardsState
  ) => ({
    type: A.openProject as const,
    project,
    clips,
    flashcards,
    now,
  }),

  closeProject: () => ({
    type: A.closeProject as const,
  }),

  closeProjectRequest: () => ({
    type: A.closeProjectRequest as const,
  }),

  addMediaToProjectRequest: (
    projectId: ProjectId,
    filePaths: Array<MediaFilePath>
  ) => ({
    type: A.addMediaToProjectRequest as const,
    projectId,
    filePaths,
  }),

  saveProjectRequest: () => ({
    type: A.saveProjectRequest as const,
  }),

  saveProjectAsRequest: () => ({
    type: A.saveProjectAsRequest as const,
  }),

  setWorkIsUnsaved: (workIsUnsaved: boolean) => ({
    type: A.setWorkIsUnsaved as const,
    workIsUnsaved,
  }),
}

function update<F extends keyof FileUpdates>(u: FileUpdate<F>) {
  return u as any as FileUpdate<keyof FileUpdates>
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
