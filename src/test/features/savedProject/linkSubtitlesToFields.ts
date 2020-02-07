import { TestSetup } from '../../spectronApp'
import { waveform$ } from '../../../components/Waveform'
import { flashcardFormFieldMenu$ } from '../../../components/FlashcardSectionFormFieldPopoverMenu'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'

export default async function linkSubtitlesToFields({
  app,
  client,
}: TestSetup) {
  await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
  const [polarBearCafe] = await client.elements_(
    mediaFilesMenu$.mediaFileMenuItem
  )
  await polarBearCafe.click()
  await client.waitUntil(
    async () =>
      (await client.getAttribute('video', 'src')) === 'polar_bear_cafe.mp4'
  )

  await client.clickElement_(waveform$.waveformClip)

  await client.clickElement_(flashcardFormFieldMenu$.openMenuButton)
  const [, external] = await client.elements_(flashcardFormFieldMenu$.menuItem)
  await external.click()
  await client.waitForText('body', 'Transcription (External')
}
