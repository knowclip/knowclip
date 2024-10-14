import { join } from 'path'
import { IntegrationTestContext } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu.testLabels'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'
import { parseProjectJson } from '../../../node/parseProject'
import { test, expect } from '../../test'

export default async function saveAndCloseProject(
  context: IntegrationTestContext
) {
  test('save project', async () => {
    const { client } = context
    await saveProjectViaButton(client)
  })

  test('close project', async () => {
    const { client } = context
    await closeProject(client)
  })

  test('project file was saved', async () => {
    const { client } = context
    const actualProjectFileContents = await parseProjectJson(
      join(context.temporaryDirectory, 'project_with_subtitles.kyml')
    )
    expect(actualProjectFileContents).toMatchSnapshot()

    const { recentProjectsListItem } = projectsMenu$
    await client.waitForText_(recentProjectsListItem, 'Project with subtitles')
  })
}
