import { TestSetup, TMP_DIRECTORY } from '../../setup'
import { testLabels as projectsMenu } from '../../../components/ProjectsMenu'
import { testLabels as newProjectForm } from '../../../components/Dialog/NewProjectFormDialog'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function createNewProject({
  app,
  clientWrapper,
}: TestSetup) {
  await clientWrapper.clickElement_(projectsMenu.newProjectButton)

  await mockElectronHelpers(app, {
    showSaveDialog: [
      Promise.resolve(join(TMP_DIRECTORY, 'my_cool_new_project.afca')),
    ],
  })
  const {
    projectNameField,
    projectFileLocationField,
    noteTypeSelect,
    transcriptionNoteTypeOption,
    saveButton,
    cardsPreview,
  } = newProjectForm

  await clientWrapper.setFieldValue_(projectNameField, 'My cool new poject')

  await clientWrapper.clickElement_(projectFileLocationField)

  await clientWrapper.clickElement_(noteTypeSelect)
  await clientWrapper.clickElement_(transcriptionNoteTypeOption)

  await clientWrapper.waitUntilPresent_(cardsPreview)

  await clientWrapper.waitUntilGone_(newProjectForm.transcriptionNoteTypeOption)

  await clientWrapper.clickElement_(saveButton)

  await clientWrapper.waitUntilPresent_(
    mediaFilesMenu.chooseFirstMediaFileButton
  )
}
