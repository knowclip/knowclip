import { dragMouse } from './runEvents'
import { ClientWrapper } from './ClientWrapper'
import { waveform$ } from '../../components/Waveform'

export async function waveformMouseDrag(
  client: ClientWrapper,
  start: number,
  end: number
) {
  const waveform = await client.firstElement_(waveform$.container)
  try {
    const rect = await client._client.client.getElementRect(waveform.elementId)

    const { y, height } = rect
    const midpoint = y + Math.round(height / 2)
    await dragMouse(client._client, [start, midpoint], [end, midpoint])
  } catch (err) {
    throw err
  }
}
