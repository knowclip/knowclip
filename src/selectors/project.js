// @flow
import * as audioSelectors from './audio'

export const getProject = (state: AppState): Project1_0_0 => {
  const noteType = audioSelectors.getCurrentNoteType(state)
  if (!noteType) throw new Error('no note type found')
  const audioFileName = audioSelectors.getCurrentFileName(state)
  if (!audioFileName) throw new Error('no audio file name found')
  const audioFileId = audioSelectors.getCurrentFileId(state)
  if (!audioFileId) throw new Error('no audio file id found')

  return {
    version: '1.0.0',
    clips: state.clips.byId,
    noteType,
    audioFileName,
    audioFileId,
  }
}
