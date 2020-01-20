import { TestSetup } from '../../setup'
import { testLabels as projectMenu } from '../../../components/ProjectMenu'
export default async function changeProjectName(setup: TestSetup) {
  const { clientWrapper } = setup
  const { projectTitle, projectTitleInput } = projectMenu

  const projectTitleEl = await clientWrapper.element_(projectTitle)
  await projectTitleEl.waitForText('My cool new poject')

  await projectTitleEl.doubleClick()
  const projectTitleInputEl = await clientWrapper.element_(projectTitleInput)
  await projectTitleInputEl.doubleClick()
  await clientWrapper.pressKeys([
    ...[...Array(15)].map(() => 'Backspace'),
    ...'My cool new project',
    'Enter',
  ])

  await (await clientWrapper.element_(projectTitle)).waitForText(
    'My cool new project'
  )
}
