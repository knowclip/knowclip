import { Application } from 'spectron'

export async function runEvents(app: Application, [next, ...rest]: any[]) {
  if (next) {
    await app.webContents.sendInputEvent(next)
    await runEvents(app, rest)
  }
}

export async function dragMouse(
  app: Application,
  start: [number, number],
  end: [number, number]
) {
  const mouseDragEvents = getMouseDragEvents(start, end)
  await runEvents(app, mouseDragEvents)
}

export async function clickAt(app: Application, [x, y]: [number, number]) {
  await runEvents(app, [
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
  ])
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
    },
  ]
}
