import { MouseEvent } from 'react'

export default class WaveformMousedownEvent extends Event {
  seconds: number
  browserMousedown: MouseEvent<SVGElement>
  svg: SVGElement

  constructor(browserMousedown: MouseEvent<SVGElement>, seconds: number) {
    super('waveformMousedown')
    this.browserMousedown = browserMousedown
    this.svg = browserMousedown.currentTarget
    this.seconds = seconds
  }

  get milliseconds() {
    return this.seconds * 1000
  }
}
