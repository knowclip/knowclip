export const setCursorX = (x: number) => {
  const cursor: SVGLineElement | null = document.querySelector('.cursor')
  if (cursor) {
    const string = String(x)
    cursor.setAttribute('x1', string)
    cursor.setAttribute('x2', string)
  }
}

const incrementPerSecond = 49
const incrementPerMs = incrementPerSecond / 1000
export const moveCursorRight = (increment: number) => {
  const cursor: SVGLineElement | null = document.querySelector('.cursor')
  if (cursor) {
    const string = String(cursor.x1.baseVal.value + increment)
    cursor.setAttribute('x1', string)
    cursor.setAttribute('x2', string)
  }
}

let animationFrame: number
let lastTime: number | null = null

export const moveCursorRightTime = (time: number) => {
  if (lastTime == null) lastTime = time
  const elapsed = time - lastTime

  lastTime = time

  moveCursorRight(incrementPerMs * elapsed)

  animationFrame = requestAnimationFrame(moveCursorRightTime)
}

export const startMovingCursor = () => {
  animationFrame = requestAnimationFrame(moveCursorRightTime)
}

export const stopMovingCursor = () => {
  lastTime = null
  cancelAnimationFrame(animationFrame)
}
