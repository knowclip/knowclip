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
    const rectangle = await client._client.getElementRect(waveform.elementId)

    const { y, height } = rectangle
    const midpoint = y + Math.round(height / 2)
    await dragMouse(app, [start, midpoint], [end, midpoint])
  } catch (err) {
    throw err
  }
}
