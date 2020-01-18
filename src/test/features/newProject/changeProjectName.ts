import { TestSetup, _ } from '../../setup'
import { testLabels as projectMenu } from '../../../components/ProjectMenu'
export default async function changeProjectName(setup: TestSetup) {
  const { $, client } = setup
  const { projectTitle, projectTitleInput } = projectMenu

  expect(await $(projectTitle).getText()).toContain('My cool poject')
  await $(projectTitle).doubleClick()
  await $(projectTitleInput).doubleClick()
  await $(projectTitleInput).keys([
    ...[...Array(10)].map(() => 'Backspace'),
    ...'My cool project',
  ])
  await $(projectTitleInput).submitForm()

  await client.waitForExist(_(projectTitle))
  expect(await $(projectTitle).getText()).toContain('My cool project')
}
