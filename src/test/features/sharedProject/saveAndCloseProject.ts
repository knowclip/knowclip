import { join } from 'path'
import { IntegrationTestContext } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu.testLabels'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'
import { parseProjectJson } from '../../../node/parseProject'
import { test, expect } from '../../test'

export default async function saveAndCloseProject(
  context: IntegrationTestContext
) {
  test('save and close project', async () => {
    const { client } = context

    await saveProjectViaButton(client)

    const actualProjectFileContents = parseProjectJson(
      join(context.temporaryDirectory, 'project_shared_with_me.kyml')
    )

    expect(actualProjectFileContents).toMatchSnapshot()

    await closeProject(client)

    const { recentProjectsListItem } = projectsMenu$
    await client.waitForText_(
      recentProjectsListItem,
      "My friend's shared project"
    )
  })
}
