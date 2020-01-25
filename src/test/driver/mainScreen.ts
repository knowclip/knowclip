import { ClientWrapper } from './ClientWrapper'
import { projectMenu$ } from '../../components/ProjectMenu'

export async function saveProjectViaButton(client: ClientWrapper) {
  await client.clickElement_(projectMenu$.saveButton)
  await client.waitForText('body', 'Project saved')
}
export async function closeProject(client: ClientWrapper) {
  await client.clickElement_(projectMenu$.closeButton)
}
