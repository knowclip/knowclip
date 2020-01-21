import { TestSetup, TMP_DIRECTORY } from '../../app'
import { testLabels as projectsMenu } from '../../../components/ProjectsMenu'
import { testLabels as newProjectForm } from '../../../components/Dialog/NewProjectFormDialog'
import { testLabels as main } from '../../../components/Main'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function createNewProject({ app, client }: TestSetup) {
  await client.clickElement_(projectsMenu.newProjectButton)

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

  await client.setFieldValue_(projectNameField, 'My cool new poject')

  await client.clickElement_(projectFileLocationField)

  await client.clickElement_(noteTypeSelect)
  await client.clickElement_(transcriptionNoteTypeOption)

  await client.waitUntilPresent_(cardsPreview)
  await client.waitForText_(
    cardsPreview,
    'Includes fields for transcription, pronunciation, meaning, and'
  )

  await client.waitUntilGone_(newProjectForm.transcriptionNoteTypeOption)

  await client.clickElement_(saveButton)

  await client.waitUntilPresent_(main.container)
}
