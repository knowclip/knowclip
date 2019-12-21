export const isLoadFileSuccess = <F extends FileRecord>(
  fileRecordType: F['type']
) => (action: Action): action is LoadFileSuccessWith<F> =>
    action.type === A.LOAD_FILE_SUCCESS &&
    action.validatedFileRecord.type === fileRecordType

export const getExtensions = (fileRecord: FileRecord) => {
  switch (fileRecord.type) {
    case 'ConstantBitrateMp3':
      return ['mp3']
    case 'ExternalSubtitlesFile':
      return ['vtt', 'srt', 'ass']
    case 'MediaFile':
      return []
    case 'ProjectFile':
      return ['afca']
    case 'TemporaryVttFile':
      return ['vtt']
    // case 'VideoStillImage':
    //   return ['png'] // ??
    case 'WaveformPng':
      return ['png']
  }
}
