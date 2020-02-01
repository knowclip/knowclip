import { TestSetup } from '../../spectronApp'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'

export default async function saveAndCloseProject(
  { client }: TestSetup,
  projectTitle: string
) {
  await saveProjectViaButton(client)

  await closeProject(client)

  const { recentProjectsListItem } = projectsMenu$
  await client.waitForText_(recentProjectsListItem, projectTitle)
}
