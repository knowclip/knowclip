import A from '../types/ActionType'
import { KnowclipActionCreatorsSubset } from '.'
import { filesActions } from './files'
import { FileUpdateName } from '../files/FileUpdateName'

export const projectActions = {
  createProject: (name: string, noteType: NoteType, filePath: string) => {
    return {
      type: A.createProject,
      name,
      noteType,
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
} satisfies KnowclipActionCreatorsSubset

const setProjectName = (id: ProjectId, name: string) =>
  filesActions.updateFile({
    id,
    fileType: 'ProjectFile',
    updateName: FileUpdateName.SetProjectName,
    updatePayload: [name],
  })
const deleteMediaFromProject = (
  projectId: ProjectId,
  mediaFileId: MediaFileId
) =>
  filesActions.updateFile({
    fileType: 'ProjectFile',
    id: projectId,
    updateName: FileUpdateName.DeleteProjectMedia,
    updatePayload: [mediaFileId],
  })

export const compositeProjectActions = {
  setProjectName,
  deleteMediaFromProject,
}
