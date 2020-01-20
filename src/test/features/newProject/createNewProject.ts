import { TestSetup, TMP_DIRECTORY, _ } from '../../setup'
import { testLabels as projectsMenu } from '../../../components/ProjectsMenu'
import { testLabels as newProjectForm } from '../../../components/Dialog/NewProjectFormDialog'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function createNewProject({ app, client, $_ }: TestSetup) {
  $_(projectsMenu.newProjectButton).click()

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

  await client.waitForExist(_(projectNameField))
  await $_(projectNameField).setValue('My cool new poject')

  $_(projectFileLocationField).click()

  $_(noteTypeSelect).click()
  await client.waitForExist(_(transcriptionNoteTypeOption))
  await $_(transcriptionNoteTypeOption).click()

  await client.waitForExist(_(cardsPreview))

  await app.client.waitUntil(
    async () =>
      !(await app.client.isExisting(
        _(newProjectForm.transcriptionNoteTypeOption)
      ))
  )

  await $_(saveButton).click()

  await client.waitForExist(_(mediaFilesMenu.chooseFirstMediaFileButton))
}
