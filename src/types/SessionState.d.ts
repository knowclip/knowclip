declare type SessionState = {
  platform: 'darwin' | 'win32' | 'linux'
  localServerAddress: string
  waveformSelection: WaveformSelection | null
  defaultTags: Array<string>
  defaultIncludeStill: boolean
  tagsToClipIds: {
    [K: string]: Array<ClipId>
  }
  currentProjectId: ProjectId | null
  currentMediaFileId: MediaFileId | null
  currentMediaFileMetadata: import('fluent-ffmpeg').FfprobeData | null
  workIsUnsaved: boolean
  loopMedia: LoopState
  editingCards: boolean
  dictionaryPopoverIsOpen: boolean

  progress: ProgressInfo | null
}

declare type MinimalInitialSessionState = Pick<
  SessionState,
  'platform' | 'localServerAddress'
>

declare type LoopState = LoopReason | false
declare type LoopReason = 'FOCUS' | 'EDIT' | 'KEYBOARD' | 'BUTTON'

declare type ProgressInfo = {
  message: string
  percentage: number
}

declare type WaveformSelection =
  | {
      type: 'Clip'
      id: ClipId
    }
  | { type: 'Preview'; id: string }
