export const isOpenFileSuccess = <F extends FileMetadata>(
  fileType: F['type']
) => (action: Action): action is OpenFileSuccessWith<F> =>
  action.type === A.OPEN_FILE_SUCCESS && action.validatedFile.type === fileType

export const getExtensions = (file: FileMetadata) => {
  switch (file.type) {
    case 'ConstantBitrateMp3':
      return ['mp3']
    case 'ExternalSubtitlesFile':
      return ['vtt', 'srt', 'ass']
    case 'MediaFile':
      return []
    case 'ProjectFile':
      return ['afca']
    case 'VttConvertedSubtitlesFile':
      return ['vtt']
    // case 'VideoStillImage':
    //   return ['png'] // ??
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
      return 'generated file' // should not be displayed to user
  }
}
export const getHumanFileName = (file: FileMetadata) => {
  return getHumanFileTypeName(file) + ('name' in file ? ` "${file.name}"` : '')
}
