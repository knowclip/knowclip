export default class WaveformMousedownEvent extends Event {
  seconds: number
  svg: SVGElement

  constructor(svg: SVGElement, seconds: number) {
    super('waveformMousedown')
    this.svg = svg
    this.seconds = seconds
  }

  get milliseconds() {
    return this.seconds * 1000
  }
}
