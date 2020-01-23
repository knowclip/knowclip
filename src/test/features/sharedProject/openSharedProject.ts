import { TestSetup, TMP_DIRECTORY } from '../../spectronApp'
import { main$ } from '../../../components/Main'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { fileSelectionForm$ } from '../../../components/FileSelectionForm'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'

export default async function openSharedProject({ app, client }: TestSetup) {
  await mockElectronHelpers(app, {
    showOpenDialog: [
      Promise.resolve([join(TMP_DIRECTORY, 'project_shared_with_me.afca')]),
    ],
  })
  await client.clickElement_(projectsMenu$.openExistingProjectButton)

  await client.waitUntilPresent_(main$.container)

  await client.clickElement_(fileSelectionForm$.cancelButton)
}
