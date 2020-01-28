import { ClientWrapper } from './ClientWrapper'
import { projectMenu$ } from '../../components/ProjectMenu'
import { snackbar$ } from '../../components/Snackbar'

export async function saveProjectViaButton(client: ClientWrapper) {
  await client.clickElement_(projectMenu$.saveButton)
  await client.waitForText_(snackbar$.container, 'Project saved')
}
export async function closeProject(client: ClientWrapper) {
  await client.clickElement_(projectMenu$.closeButton)
}
