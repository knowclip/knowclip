import { IntegrationTestContext, TMP_DIRECTORY } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { newProjectFormDialog$ } from '../../../components/Dialog/NewProjectFormDialog'
import { main$ } from '../../../components/Main'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function createNewProject(
  context: IntegrationTestContext,
  /** Not including extension */
  projectFileName: string,
  projectTitle: string
) {
  test('open and fill in new project form', async () => {
    const { app, client } = context

    await client.clickElement_(projectsMenu$.newProjectButton)

    await mockElectronHelpers(app, {
      showSaveDialog: [
        Promise.resolve(join(TMP_DIRECTORY, projectFileName + '.kyml')),
      ],
    })
    const {
      projectNameField,
      projectFileLocationField,
      noteTypeSelect,
      transcriptionNoteTypeOption,
      saveButton,
      cardsPreview,
    } = newProjectFormDialog$

    await client.setFieldValue_(projectNameField, projectTitle)

    await client.clickElement_(projectFileLocationField)

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

    await client.clickElement_(saveButton)

    await client.waitUntilPresent_(main$.container)
  })
}
