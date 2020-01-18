import { TestSetup, mockElectronHelpers, TMP_DIRECTORY, _ } from '../../setup'
import { testLabels as projectsMenu } from '../../../components/ProjectsMenu'
import { testLabels as newProjectForm } from '../../../components/Dialog/NewProjectFormDialog'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesNavMenu'
import { join } from 'path'

export default async function createNewProject({ app, client, $ }: TestSetup) {
  $(projectsMenu.newProjectButton).click()

  await mockElectronHelpers(app, {
    showSaveDialog: Promise.resolve(
      join(TMP_DIRECTORY, 'my_cool_project.afca')
    ),
  })
  const {
    projectNameField,
    projectFileLocationField,
    noteTypeSelect,
    transcriptionNoteTypeOption,
    saveButton,
    cardsPreview,
  } = newProjectForm

  await client.waitForExist(_(projectNameField))
  await $(projectNameField).setValue('My cool poject')

  $(projectFileLocationField).click()

  $(noteTypeSelect).click()
  await client.waitForExist(_(transcriptionNoteTypeOption))
  await $(transcriptionNoteTypeOption).click()

  await client.waitForExist(_(cardsPreview))

  await app.client.waitUntil(
    async () =>
      !(await app.client.isExisting(
        _(newProjectForm.transcriptionNoteTypeOption)
      ))
  )

  await $(saveButton).click()

  await client.waitForExist(_(mediaFilesMenu.chooseFirstMediaFileButton))
}
