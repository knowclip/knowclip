import { IntegrationTestContext, TMP_DIRECTORY } from '../../setUpDriver'
import { main$ } from '../../../components/Main'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { fileSelectionForm$ } from '../../../components/Dialog/FileSelectionDialog'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { snackbar$ } from '../../../components/Snackbar'

export default async function openSharedProject(
  context: IntegrationTestContext
) {
  test('open project menu and select existing project', async () => {
    const { app, client } = context
    await mockElectronHelpers(app, {
      showOpenDialog: [
        Promise.resolve([join(TMP_DIRECTORY, 'project_shared_with_me.kyml')]),
      ],
    })
    await client.clickElement_(projectsMenu$.openExistingProjectButton)

    await client.waitUntilPresent_(main$.container)

    await client.clickElement_(fileSelectionForm$.cancelButton)
    await client.waitForText_(
      snackbar$.container,
      'Could not locate media file "piggeldy_cat.mp4". Some features may be unavailable until it is located.'
    )
    await client.clickElement_(snackbar$.closeButton)
    await client.waitUntilGone_(snackbar$.closeButton)
  })
}
