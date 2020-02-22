import { TestSetup, ASSETS_DIRECTORY } from '../../spectronApp'
import { waveform$ } from '../../../components/Waveform'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { linkSubtitlesDialog$ } from '../../../components/Dialog/LinkSubtitlesDialog'

export default async function addSomeSubtitles(
  { client, app }: TestSetup,
  subtitlesFilePath: string
) {
  await client.clickElement_(subtitlesMenu$.openMenuButton)

  await mockElectronHelpers(app, {
    showOpenDialog: [
      Promise.resolve([join(ASSETS_DIRECTORY, subtitlesFilePath)]),
    ],
  })
  await client.clickElement_(subtitlesMenu$.addTrackButton)

  await client.clickElement_(linkSubtitlesDialog$.skipButton)

  await client.elements_(waveform$.subtitlesTimelines, 2)
}
