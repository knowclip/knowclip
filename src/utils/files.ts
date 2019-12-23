export const isLoadFileSuccess = <F extends FileMetadata>(
  fileType: F['type']
) => (action: Action): action is LoadFileSuccessWith<F> =>
  action.type === A.LOAD_FILE_SUCCESS && action.validatedFile.type === fileType

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
