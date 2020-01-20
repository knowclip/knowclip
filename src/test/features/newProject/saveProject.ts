import { join } from 'path'
import { readFile } from 'fs-extra'
import { TestSetup, _, TMP_DIRECTORY } from '../../setup'
import { testLabels as projectMenu } from '../../../components/ProjectMenu'
import { testLabels as projectsMenu } from '../../../components/ProjectsMenu'

export default async function saveAndCloseProject(setup: TestSetup) {
  const { client, $_ } = setup
  const { saveButton, closeButton } = projectMenu

  await client.waitForVisible(_(saveButton))
  await $_(saveButton).click()

  await client.waitUntilTextExists('body', 'Project saved')

  const actualProjectFileContents = JSON.parse(
    await readFile(join(TMP_DIRECTORY, 'my_cool_new_project.afca'), 'utf8')
  )

  expect(actualProjectFileContents).toMatchSnapshot()

  await $_(closeButton).click()

  const { recentProjectsListItem } = projectsMenu
  expect(await $_(recentProjectsListItem).getText()).toContain(
    'My cool new project'
  )
}
