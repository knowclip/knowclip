import { TestSetup } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'
import { snackbar$ } from '../../../components/Snackbar'

export default async function saveAndCloseProject(
  { client }: TestSetup,
  projectTitle: string
) {
  await saveProjectViaButton(client)

  await client.clickElement_(snackbar$.closeButton)

  await closeProject(client)

  const { recentProjectsListItem } = projectsMenu$
  await client.waitForText_(recentProjectsListItem, projectTitle)
}
