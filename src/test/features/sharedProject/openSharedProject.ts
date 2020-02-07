import { TestSetup, TMP_DIRECTORY } from '../../spectronApp'
import { main$ } from '../../../components/Main'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { fileSelectionForm$ } from '../../../components/Dialog/FileSelectionDialog'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { snackbar$ } from '../../../components/Snackbar'

export default async function openSharedProject({ app, client }: TestSetup) {
  await mockElectronHelpers(app, {
    showOpenDialog: [
      Promise.resolve([join(TMP_DIRECTORY, 'project_shared_with_me.kyml')]),
    ],
  })
  await client.clickElement_(projectsMenu$.openExistingProjectButton)

  await client.waitUntilPresent_(main$.container)

  await client.clickElement_(fileSelectionForm$.cancelButton)
  await client.clickElement_(snackbar$.closeButton)
}
