export const setCursorX = (x: number) => {
  const cursor: SVGLineElement | null = document.querySelector('.cursor')
  if (cursor) {
    const string = String(x)
    cursor.setAttribute('x1', string)
    cursor.setAttribute('x2', string)
  }
}

export const syncCursor = (_increment: number) => {
  const cursor: SVGLineElement | null = document.querySelector('.cursor')
  if (cursor) {
    const player = document.getElementById('mediaPlayer') as
      | HTMLVideoElement
      | HTMLAudioElement
      | null
    const string = player ? String(player.currentTime * 50) : '0'
    cursor.setAttribute('x1', string)
    cursor.setAttribute('x2', string)
  }

  animationFrame = requestAnimationFrame(syncCursor)
}

let animationFrame: number

export const startMovingCursor = () => {
  animationFrame = requestAnimationFrame(syncCursor)
}

export const stopMovingCursor = () => {
  cancelAnimationFrame(animationFrame)
}
