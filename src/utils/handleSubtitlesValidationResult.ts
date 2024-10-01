import r from '../redux'

export function handleSubtitlesValidationResult<S extends SubtitlesFile>(
  effects: EpicsDependencies,
  existingFile: S,
  sourceFilePath: string,
  validationResult: Awaited<
    ReturnType<EpicsDependencies['validateSubtitleFileBeforeOpen']>
  >
) {
  if (validationResult.error) {
    return r.openFileFailure(
      existingFile,
      sourceFilePath,
      validationResult.error.message
    )
  }
  const validation = validationResult.value
  if (validation.type === 'no issues') {
    return r.openFileSuccess(
      validation.file,
      sourceFilePath,
      effects.nowUtcTimestamp()
    )
  }
  return r.confirmationDialog(
    validation.result.warningMessage,
    r.openFileSuccess(
      validation.file,
      sourceFilePath,
      effects.nowUtcTimestamp()
    ),
    r.openFileFailure(
      existingFile,
      sourceFilePath,
      `Some features may be unavailable until your file is located.`
    ),
    true
  )
}
