import { join } from 'path'
import { readFile } from 'fs-extra'
import { TestSetup, TMP_DIRECTORY } from '../../spectronApp'
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
