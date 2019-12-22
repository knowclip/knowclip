export default class WaveformMousedownEvent extends Event {
  x: number
  y: number
  svg: SVGElement

  constructor(svg: SVGElement, { x, y }: { x: number, y: number }) {
    super('waveformMousedown')
    this.svg = svg
    this.x = x
    this.y = y
  }
}