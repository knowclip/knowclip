declare type PendingClip = {
  start: WaveformX
  end: WaveformX
}

declare type PendingStretch = {
  originKey: 'start' | 'end'
  id: ClipId
  end: WaveformX
}

declare type SessionState = {
  pendingClip: PendingClip | null
  pendingStretch: PendingStretch | null
  waveformSelection: WaveformSelection | null
  defaultTags: Array<string>
  defaultIncludeStill: boolean
  tagsToClipIds: {
    [K: string]: Array<ClipId>
  }
  currentProjectId: ProjectId | null
  currentMediaFileId: MediaFileId | null
  workIsUnsaved: boolean
  loopMedia: boolean
  mediaIsPlaying: boolean
  editingCards: boolean

  progress: ProgressInfo | null
}

declare type ProgressInfo = {
  message: string
  percentage: number
}

declare type WaveformSelection =
  | { type: 'Clip'; id: ClipId }
  | { type: 'Preview'; index: number }
