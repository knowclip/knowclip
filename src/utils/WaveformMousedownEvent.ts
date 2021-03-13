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

export class WaveformDragEvent extends Event {
  action: WaveformDragAction

  constructor(action: WaveformDragAction) {
    super('waveformDrag')
    this.action = action
  }
}

export type WaveformDragAction =
  | WaveformDragCreate
  | WaveformDragMove
  | WaveformDragStretch

export type WaveformDragCreate = {
  type: 'CREATE'
  start: number
  end: number
  viewState: ViewState
}
export type WaveformDragMove = {
  type: 'MOVE'
  start: number
  end: number
  clipToMove: { id: ClipId; start: number; end: number }
  viewState: ViewState
}
export type WaveformDragStretch = {
  type: 'STRETCH'
  start: number
  end: number
  clipToStretch: { id: ClipId; start: number; end: number }
  viewState: ViewState
}
