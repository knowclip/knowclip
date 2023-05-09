import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'
import { IntegrationTestContext } from '../../setUpDriver'

export default async function saveAndCloseProject(
  context: IntegrationTestContext,
  projectTitle: string
) {
  test('saves and closes project', async () => {
    const { client } = context
    await saveProjectViaButton(client)

    await closeProject(client)

    const { recentProjectsListItem } = projectsMenu$
    await client.waitForText_(recentProjectsListItem, projectTitle)
  })
}
