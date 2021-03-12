declare type PendingWaveformAction =
  | PendingClip
  | PendingStretch
  | PendingClipMove

declare type PendingClip = {
  type: 'PendingClip'
  start: WaveformX
  end: WaveformX
}

declare type PendingStretch = {
  type: 'PendingStretch'
  originKey: 'start' | 'end'
  id: ClipId
  end: WaveformX
}

declare type PendingClipMove = {
  type: 'PendingClipMove'
  start: WaveformX
  end: WaveformX
  deltaX: number
}

declare type SessionState = {
  pendingWaveformAction: PendingWaveformAction | null
  waveformSelection: WaveformSelection | null
  defaultTags: Array<string>
  defaultIncludeStill: boolean
  tagsToClipIds: {
    [K: string]: Array<ClipId>
  }
  currentProjectId: ProjectId | null
  currentMediaFileId: MediaFileId | null
  workIsUnsaved: boolean
  loopMedia: LoopState
  mediaIsPlaying: boolean
  editingCards: boolean
  dictionaryPopoverIsOpen: boolean

  progress: ProgressInfo | null
}

declare type LoopState = LoopReason | false
declare type LoopReason = 'FOCUS' | 'EDIT' | 'KEYBOARD' | 'BUTTON'

declare type ProgressInfo = {
  message: string
  percentage: number
}

declare type WaveformSelection =
  | { type: 'Clip'; index: number; id: ClipId }
  | { type: 'Preview'; index: number; cardBaseIndex: number }
