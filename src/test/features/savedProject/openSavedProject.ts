import { TestSetup } from '../../spectronApp'
import { testLabels as projectsMenu } from '../../../components/ProjectsMenu'
import { testLabels as waveform } from '../../../components/Waveform'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'

export default async function openSavedProject({ app, client }: TestSetup) {
  await client.clickElement_(projectsMenu.recentProjectsListItem)

  await client.waitUntilPresent_(mediaFilesMenu.openMediaFilesMenuButton)

  await client.waitForText_(
    mediaFilesMenu.openMediaFilesMenuButton,
    'polar_bear_cafe.mp4'
  )
  await client.elements_(waveform.subtitlesTimelines, 2)

  await client.clickElement_(mediaFilesMenu.openMediaFilesMenuButton)

  const mediaFiles = await client.elements_(mediaFilesMenu.mediaFileMenuItem)

  await mediaFiles[1].click()

  await client.waitForText_(
    mediaFilesMenu.openMediaFilesMenuButton,
    'piggeldy_cat.mp4'
  )
}
