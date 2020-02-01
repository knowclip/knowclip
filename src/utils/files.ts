export const getExtensions = (file: FileMetadata) => {
  switch (file.type) {
    case 'ConstantBitrateMp3':
      return ['mp3']
    case 'ExternalSubtitlesFile':
      return ['vtt', 'srt', 'ass']
    case 'MediaFile':
      return []
    case 'ProjectFile':
      return ['knowclip.yml']
    case 'VttConvertedSubtitlesFile':
      return ['vtt']
    case 'VideoStillImage':
      return ['png']
    case 'WaveformPng':
      return ['png']
  }
}

const getHumanFileTypeName = (file: FileMetadata) => {
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
export const getHumanFileName = (file: FileMetadata) => {
  return getHumanFileTypeName(file) + ('name' in file ? ` "${file.name}"` : '')
}

export const areSameFile = <F extends FileMetadata>(
  a: F,
  b: FileMetadata
): boolean => a.id === b.id && a.type === b.type
