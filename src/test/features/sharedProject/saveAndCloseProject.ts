import { join } from 'path'
import { TestSetup, TMP_DIRECTORY } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'
import { parseProjectJson } from '../../../utils/parseProject'

export default async function saveAndCloseProject({ client }: TestSetup) {
  await saveProjectViaButton(client)

  const actualProjectFileContents = parseProjectJson(
    join(TMP_DIRECTORY, 'my_previously_saved_project.kyml')
  )

  expect(actualProjectFileContents).toMatchSnapshot()

  await closeProject(client)

  const { recentProjectsListItem } = projectsMenu$
  await client.waitForText_(
    recentProjectsListItem,
    "My friend's shared project"
  )
}
