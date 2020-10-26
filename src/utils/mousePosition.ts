declare global {
  interface Window {
    mousePosition: null | [number, number]
  }
}

export function setMousePosition(coords: [number, number]) {
  window.mousePosition = coords
}

export function getMousePosition() {
  return window.mousePosition
}
