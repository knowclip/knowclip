import { IntegrationTestContext, TMP_DIRECTORY } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu.testLabels'
import { newProjectFormDialog$ } from '../../../components/Dialog/NewProjectFormDialog.testLabels'
import { main$ } from '../../../components/Main.testLabels'
import { join } from 'path'
import { mockElectronHelpers } from '../../mockElectronHelpers'
import { test } from '../../test'
import { _ } from 'ajv'
import { mockSideEffects } from '../../mockSideEffects'

const {
  projectNameField,
  projectFileLocationField,
  noteTypeSelect,
  transcriptionNoteTypeOption,
  saveButton,
  cardsPreview,
} = newProjectFormDialog$

export default async function createNewProject(
  context: IntegrationTestContext,
  /** Not including extension */
  projectFileName: string,
  projectTitle: string,
  projectId: string
) {
  test('open new project form', async () => {
    const { client } = context

    await client.clickElement_(projectsMenu$.newProjectButton)
  })

  test('select file location', async () => {
    const { app } = context
    await mockElectronHelpers(app, {
      showSaveDialog: [
        Promise.resolve(join(TMP_DIRECTORY, projectFileName + '.kyml')),
      ],
    })
  })
  test('fill in text fields', async () => {
    const { client } = context

    await client.setFieldValue_(projectNameField, projectTitle)

    await client.clickElement_(projectFileLocationField)
  })

  test('select note type', async () => {
    const { client } = context

    await client.clickElement_(noteTypeSelect)
    await client.clickElement_(transcriptionNoteTypeOption)

    await client.waitUntilPresent_(cardsPreview)
    await client.waitForText_(
      cardsPreview,
      'Includes fields for transcription, pronunciation, meaning, and'
    )

    await client.waitUntilGone_(
      newProjectFormDialog$.transcriptionNoteTypeOption
    )
  })
  test('save project', async () => {
    const { app, client } = context

    await mockSideEffects(app, {
      uuid: [projectId],
    })

    await client.clickElement_(saveButton)

    await client.waitUntilPresent_(main$.container)
  })
}
