import { TestSetup, _ } from '../../setup'
import { testLabels as projectMenu } from '../../../components/ProjectMenu'
export default async function changeProjectName(setup: TestSetup) {
  const { $_, client } = setup
  const { projectTitle, projectTitleInput } = projectMenu

  expect(await $_(projectTitle).getText()).toContain('My cool new poject')
  await $_(projectTitle).doubleClick()
  await $_(projectTitleInput).doubleClick()
  await $_(projectTitleInput).keys([
    ...[...Array(15)].map(() => 'Backspace'),
    ...'My cool new project',
  ])
  await $_(projectTitleInput).submitForm()

  await client.waitForExist(_(projectTitle))
  expect(await $_(projectTitle).getText()).toContain('My cool new project')
}
