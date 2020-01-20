import { join } from 'path'
import { readFile } from 'fs-extra'
import { TestSetup, TMP_DIRECTORY } from '../../setup'
import { testLabels as projectMenu } from '../../../components/ProjectMenu'
import { testLabels as projectsMenu } from '../../../components/ProjectsMenu'

export default async function saveAndCloseProject({
  client,
}: TestSetup) {
  const { saveButton, closeButton } = projectMenu

  await client.waitForVisible_(saveButton)
  await client.clickElement_(saveButton)

  await client.waitForText('body', 'Project saved')

  const actualProjectFileContents = JSON.parse(
    await readFile(join(TMP_DIRECTORY, 'my_cool_new_project.afca'), 'utf8')
  )

  expect(actualProjectFileContents).toMatchSnapshot()

  await client.clickElement_(closeButton)

  const { recentProjectsListItem } = projectsMenu
  await client.waitForText_(
    recentProjectsListItem,
    'My cool new project'
  )
}
