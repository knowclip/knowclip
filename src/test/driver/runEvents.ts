import { TestDriver } from './TestDriver'

export async function clickAt(app: TestDriver, [x, y]: [number, number]) {
  try {
    await app.client.actions([
      app.client
        .action('pointer')
        .move({ origin: 'viewport', x, y })
        .down()
        .move({
          origin: 'viewport',
          x,
          y,
        })
        .up(),
    ])
  } catch (err) {
    throw new Error(`Could not click mouse at [${x}, ${y}]: ${err}`)
  }
}
