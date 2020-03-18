import { TestSetup } from '../../spectronApp'
import { waveform$ } from '../../../components/Waveform'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function linkSubtitlesToFields({
  app,
  client,
}: TestSetup) {
  await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
  await client.waitForText_(
    mediaFilesMenu$.mediaFileMenuItem,
    'polar_bear_cafe.mp4'
  )
  await client.clickElement_(mediaFilesMenu$.mediaFileMenuItem)
  await client.waitForText_(
    mediaFilesMenu$.openMediaFilesMenuButton,
    'polar_bear_cafe.mp4'
  )
  await client.clickElement_(waveform$.waveformClip)

  await client.clickElement_(flashcardFieldMenu$.openMenuButtons)
  await client.elements_(flashcardFieldMenu$.menuItem, 2)
  await client.clickElement_(flashcardFieldMenu$.externalTrackMenuItem)
  await client.waitUntilGone_(flashcardFieldMenu$.externalTrackMenuItem)
  await client.waitUntilPresent_(confirmationDialog$.okButton)
  await client.clickElement_(confirmationDialog$.okButton)
  await client.waitForText_(
    flashcardSection$.container,
    '笹を食べながらのんびりするのは最高だなぁ'
  )
}
