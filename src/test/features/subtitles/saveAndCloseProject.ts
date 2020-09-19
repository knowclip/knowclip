import { join } from 'path'
import { TestSetup, TMP_DIRECTORY } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'
import { parseProjectJson } from '../../../utils/parseProject'

export default async function saveAndCloseProject({ client }: TestSetup) {
  await saveProjectViaButton(client)

  const actualProjectFileContents = await parseProjectJson(
    join(TMP_DIRECTORY, 'project_with_subtitles.kyml')
  )

  await closeProject(client)

  expect(actualProjectFileContents).toMatchSnapshot()

  const { recentProjectsListItem } = projectsMenu$
  await client.waitForText_(recentProjectsListItem, 'Project with subtitles')
}
