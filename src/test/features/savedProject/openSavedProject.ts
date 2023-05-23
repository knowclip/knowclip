import { IntegrationTestContext } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu.testLabels'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu.testLabels'
import { test } from '../../test'

export default async function openSavedProject(
  context: IntegrationTestContext
) {
  test('open saved project', async () => {
    const { client } = context

    await client.clickElement_(projectsMenu$.recentProjectsListItem)
    await client.waitForText_(
      mediaFilesMenu$.openMediaFilesMenuButton,
      'piggeldy_cat.mp4'
    )
    await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
    await client.clickElement_(mediaFilesMenu$.mediaFileMenuItem)

    await client.waitForText_(
      mediaFilesMenu$.openMediaFilesMenuButton,
      'polar_bear_cafe.mp4'
    )

    await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)

    const mediaFiles = await client.elements_(mediaFilesMenu$.mediaFileMenuItem)

    await mediaFiles[1].click()

    await client.waitForText_(
      mediaFilesMenu$.openMediaFilesMenuButton,
      'piggeldy_cat.mp4'
    )
  })
}
