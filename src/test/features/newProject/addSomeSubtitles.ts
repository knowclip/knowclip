import { TestSetup, ASSETS_DIRECTORY } from '../../spectronApp'
import { waveform$ } from '../../../components/Waveform'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'

export default async function addSomeSubtitles({ client, app }: TestSetup) {
  await client.clickElement_(subtitlesMenu$.openMenuButton)

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')])],
  })
  await client.clickElement_(subtitlesMenu$.addTrackButton)

  await client.elements_(waveform$.subtitlesTimelines, 2)
}
