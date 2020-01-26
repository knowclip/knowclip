import { Application } from 'spectron'
import { dragMouse } from './runEvents'
import { ClientWrapper } from './ClientWrapper'
import { waveform$ } from '../../components/Waveform'

export async function waveformMouseDrag(
  app: Application,
  client: ClientWrapper,
  start: number,
  end: number
) {
  const waveform = await client.firstElement_(waveform$.container)
  try {
    const { state, message, value } = await client._client.elementIdRect(
      waveform.elementId
    )
    if (state === 'failure')
      throw new Error(`Could not drag mouse on waveform: ${message}`)

    const { y, height } = value
    const midpoint = y + Math.round(height / 2)
    await dragMouse(app, [start, midpoint], [end, midpoint])
  } catch (err) {
    throw err
  }
}
