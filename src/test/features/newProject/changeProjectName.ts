import { TestSetup } from '../../setUpDriver'
import { projectMenu$ } from '../../../components/ProjectMenu'

export default async function changeProjectName(
  setup: TestSetup,
  oldName: string,
  newName: string
) {
  const { client } = setup
  const { projectTitle, projectTitleInput } = projectMenu$

  const projectTitleEl = await client.firstElement_(projectTitle)
  await projectTitleEl.waitForText(oldName)

  await projectTitleEl.doubleClick()
  const projectTitleInputEl = await client.firstElement_(projectTitleInput)
  await projectTitleInputEl.click()
  await client.pressKeys([
    ...[...oldName].map(() => 'ArrowRight'),
    ...[...oldName].map(() => 'Backspace'),
    ...newName,
    'Enter',
  ])

  await (await client.firstElement_(projectTitle)).waitForText(newName)
}
