import { TestDriver } from './TestDriver'

export default async function runEvents(
  app: TestDriver,
  [first, ...rest]: any[],
  msBetweenEvents: number = 42
) {
  if (first) {
    await app.sendToMainProcess({ type: 'sendInputEvent', args: [first] })
    await runSubsequentEvents(app, rest, msBetweenEvents)
  }
}

async function runSubsequentEvents(
  app: TestDriver,
  [next, ...rest]: any[],
  msBetweenEvents: number = 42
) {
  if (next) {
    await sleep(msBetweenEvents)
    await app.sendToMainProcess({ type: 'sendInputEvent', args: [next] })
    await runSubsequentEvents(app, rest)
  }
}

function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(res, ms)
  })
}

export async function dragMouse(
  app: TestDriver,
  start: [number, number],
  end: [number, number]
) {
  try {
    const mouseDragEvents = getMouseDragEvents(start, end)

    await runEvents(app, mouseDragEvents)
  } catch (err) {
    const [x1, y1] = start
    const [x2, y2] = end
    throw new Error(
      `Could not drag mouse from [${x1}, ${y1}] to [${x2}, ${y2}]: ${err}`
    )
  }
}

export async function clickAt(app: TestDriver, [x, y]: [number, number]) {
  try {
    await runEvents(
      app,
      [
        {
          type: 'mouseDown',
          x,
          y,
        },
        {
          type: 'mouseMove',
          x,
          y,
        },
        {
          type: 'mouseUp',
          x,
          y,
        },
      ],
      42
    )
  } catch (err) {
    throw new Error(`Could not click mouse at [${x}, ${y}]: ${err}`)
  }
}

function getMouseDragEvents(
  [fromX, fromY]: [number, number],
  [toX, toY]: [number, number]
) {
  return [
    {
      type: 'mouseDown',
      x: fromX,
      y: fromY,
      clickCount: 1,
    },
    {
      type: 'mouseMove',
      x: ~~((toX + fromX) / 2),
      y: ~~((toY + fromY) / 2),
    },
    {
      type: 'mouseMove',
      x: toX,
      y: toY,
    },
    {
      type: 'mouseUp',
      x: toX,
      y: toY,
      clickCount: 1,
    },
  ]
}
