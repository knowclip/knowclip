import { join } from 'path'
import { readFile } from 'fs-extra'
import { TestSetup, TMP_DIRECTORY } from '../../spectronApp'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { saveProjectViaButton, closeProject } from '../../driver/mainScreen'

export default async function saveAndCloseProject({ client }: TestSetup) {
  await saveProjectViaButton(client)

  const actualProjectFileContents = JSON.parse(
    await readFile(join(TMP_DIRECTORY, 'project_with_subtitles.afca'), 'utf8')
  )

  expect(actualProjectFileContents).toMatchSnapshot()

  await closeProject(client)

  const { recentProjectsListItem } = projectsMenu$
  await client.waitForText_(recentProjectsListItem, 'Project with subtitles')
}
