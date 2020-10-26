const fileFilters = {
  ConstantBitrateMp3: [{ name: 'Constant bitrate mp3', extensions: ['mp3'] }],
  ExternalSubtitlesFile: [
    { name: 'Subtitles file', extensions: ['vtt', 'srt', 'ass'] },
  ],
  MediaFile: [
    {
      name: 'Audio or video files',
      extensions: [
        'mp3',
        'mp4',
        'wav',
        'ogg',
        'm4a',
        'mkv',
        'flac',
        'avi',
        'mov',
        'aac',
        'webm',
      ],
    },
  ],
  ProjectFile: [{ name: 'Knowclip project file', extensions: ['kyml'] }],
  VttConvertedSubtitlesFile: [
    { name: 'Temporary file from subtitles', extensions: ['vtt'] },
  ],
  VideoStillImage: [{ name: 'Still image from video', extensions: ['png'] }],
  WaveformPng: [
    { name: 'Waveform image from audio track', extensions: ['png'] },
  ],
  Dictionary: [{ name: 'Dictionary file', extensions: ['zip'] }],
}

export const getExtensions = (fileType: FileMetadata['type']) => {
  return fileFilters[fileType][0].extensions
}

export const getFileFilters = (
  fileType: FileMetadata['type']
): Electron.FileFilter[] => {
  return fileFilters[fileType]
}

const getHumanFileTypeName = (file: { type: string; name?: string }) => {
  switch (file.type) {
    case 'MediaFile':
      return 'media file'
    case 'ExternalSubtitlesFile':
      return 'subtitles file'
    case 'ProjectFile':
      return 'project file'
    case 'ConstantBitrateMp3':
    case 'WaveformPng':
    case 'VttConvertedSubtitlesFile':
    case 'VideoStillImage':
      return 'generated file' // should not be displayed to user
  }
}
export const getHumanFileName = (file: { type: string; name?: string }) => {
  return getHumanFileTypeName(file) + ('name' in file ? ` "${file.name}"` : '')
}

export const areSameFile = <F extends FileMetadata>(
  a: F,
  b: FileMetadata
): boolean => a.id === b.id && a.type === b.type

export const isGeneratedFile = (type: FileMetadata['type']): boolean => {
  switch (type) {
    case 'VttConvertedSubtitlesFile':
    case 'WaveformPng':
    case 'ConstantBitrateMp3':
    case 'VideoStillImage':
      return true
    case 'ProjectFile':
    case 'MediaFile':
    case 'ExternalSubtitlesFile':
    case 'Dictionary':
      return false
  }
}
