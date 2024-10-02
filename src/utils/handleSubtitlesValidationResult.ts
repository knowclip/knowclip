import r from '../redux'

export function handleSubtitlesValidationResult<S extends SubtitlesFile>(
  effects: EpicsDependencies,
  existingFile: S,
  filePath: string,
  validationResult: Awaited<
    ReturnType<EpicsDependencies['validateSubtitleFileBeforeOpen']>
  >
) {
  if (validationResult.error) {
    return r.openFileFailure(
      existingFile,
      filePath,
      validationResult.error.message
    )
  }
  const validation = validationResult.value
  if (validation.type === 'no issues') {
    return r.openFileSuccess(
      validation.file,
      filePath,
      effects.nowUtcTimestamp()
    )
  }
  return r.confirmationDialog(
    validation.result.warningMessage,
    r.openFileSuccess(validation.file, filePath, effects.nowUtcTimestamp()),
    r.openFileFailure(
      existingFile,
      filePath,
      `Some features may be unavailable until your file is located.`
    ),
    true
  )
}
