import { ClientWrapper } from './ClientWrapper'
import { projectMenu$ } from '../../components/ProjectMenu.testLabels'
import { snackbar$ } from '../../components/Snackbar.testLabels'

export async function saveProjectViaButton(client: ClientWrapper) {
  await client.clickElement(`#${projectMenu$.saveButton}`)
  await client.waitForText_(snackbar$.container, 'Project saved')
}
export async function closeProject(client: ClientWrapper) {
  await client.clickElement_(projectMenu$.closeButton)
}
