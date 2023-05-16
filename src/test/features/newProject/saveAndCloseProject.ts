import { IntegrationTestContext } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'
import { snackbar$ } from '../../../components/Snackbar'
import { test } from '../../test'

export default async function saveAndCloseProject(
  context: IntegrationTestContext,
  projectTitle: string
) {
  test('saves and closes project', async () => {
    const { client } = context
    await saveProjectViaButton(client)

    await client.clickElement_(snackbar$.closeButton)

    await closeProject(client)

    const { recentProjectsListItem } = projectsMenu$
    await client.waitForText_(recentProjectsListItem, projectTitle)
  })
}
