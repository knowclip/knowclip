import { IntegrationTestContext } from '../../setUpDriver'
import { projectMenu$ } from '../../../components/ProjectMenu.testLabels'
import { test } from '../../test'

const { projectTitle, projectTitleInput } = projectMenu$

export default async function changeProjectName(
  context: IntegrationTestContext,
  oldName: string,
  newName: string
) {
  test('edit project title', async () => {
    const { client } = context

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
  })

  test('ensure project title has updated', async () => {
    const { client } = context
    await (await client.firstElement_(projectTitle)).waitForText(newName)
  })
}
