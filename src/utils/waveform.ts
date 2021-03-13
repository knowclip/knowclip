export const setCursorX = (x: number) => {
  const cursor: SVGLineElement | null = document.querySelector('.cursor')
  if (cursor) {
    const string = String(x)
    cursor.setAttribute('x1', string)
    cursor.setAttribute('x2', string)
  }
}

export const syncCursor = (stepLength: number) => (_increment: number) => {
  const cursor: SVGLineElement | null = document.querySelector('.cursor')
  if (cursor) {
    const player = document.getElementById('mediaPlayer') as
      | HTMLVideoElement
      | HTMLAudioElement
      | null
    const string = player ? String(player.currentTime * stepLength) : '0'
    cursor.setAttribute('x1', string)
    cursor.setAttribute('x2', string)
  }

  animationFrame = requestAnimationFrame(syncCursor(stepLength))
}

let animationFrame: number

export const startMovingCursor = (stepLength: number) => {
  animationFrame = requestAnimationFrame(syncCursor(stepLength))
}

export const stopMovingCursor = () => {
  cancelAnimationFrame(animationFrame)
}
