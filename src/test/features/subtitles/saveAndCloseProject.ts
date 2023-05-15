import { join } from 'path'
import { IntegrationTestContext, TMP_DIRECTORY } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'
import { parseProjectJson } from '../../../utils/parseProject'

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
      join(TMP_DIRECTORY, 'project_with_subtitles.kyml')
    )
    expect(actualProjectFileContents).toMatchSnapshot()

    const { recentProjectsListItem } = projectsMenu$
    await client.waitForText_(recentProjectsListItem, 'Project with subtitles')
  })
}
