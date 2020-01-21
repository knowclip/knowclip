import { TestSetup } from '../../app'
import { testLabels as projectMenu } from '../../../components/ProjectMenu'
export default async function changeProjectName(setup: TestSetup) {
  const { client } = setup
  const { projectTitle, projectTitleInput } = projectMenu

  const projectTitleEl = await client.element_(projectTitle)
  await projectTitleEl.waitForText('My cool new poject')

  await projectTitleEl.doubleClick()
  const projectTitleInputEl = await client.element_(projectTitleInput)
  await projectTitleInputEl.click()
  await client.pressKeys([
    ...[...'My cool new poject'].map(() => 'ArrowRight'),
    ...[...'My cool new poject'].map(() => 'Backspace'),
    ...'My cool new project',
    'Enter',
  ])

  await (await client.element_(projectTitle)).waitForText('My cool new project')
}
