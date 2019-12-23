declare type PendingClip = {
  start: WaveformX
  end: WaveformX
}

declare type PendingStretch = {
  originKey: 'start' | 'end'
  id: ClipId
  end: WaveformX
}

declare type UserState = {
  pendingClip: PendingClip | null
  pendingStretch: PendingStretch | null
  highlightedClipId: ClipId | null
  defaultTags: Array<string>
  tagsToClipIds: {
    [K: string]: Array<ClipId>
  }
  currentProjectId: ProjectId | null
  currentMediaFileId: MediaFileId | null
  workIsUnsaved: boolean
  loopMedia: boolean
  mediaIsLoading: boolean // should probably exist in fileAvailabilities state
}
