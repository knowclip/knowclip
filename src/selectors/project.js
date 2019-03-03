// @flow
import * as audioSelectors from './audio'

export const getProject0_0_0 = (state: AppState): Project0_0_0 => {
  const clips: { [ClipId]: ClipWithoutFilePath } = {}
  const clipIds = audioSelectors.getClipsOrder(state)
  clipIds.forEach(id => {
    const withFilePath = state.clips.byId[id]
    clips[id] = {
      id: withFilePath.id,
      start: withFilePath.start,
      end: withFilePath.end,
      flashcard: withFilePath.flashcard,
    }
  })
  const noteType = audioSelectors.getCurrentNoteType(state)
  if (!noteType) throw new Error('no note type found')
  const audioFileName = audioSelectors.getCurrentFileName(state)
  if (!audioFileName) throw new Error('no audio file name found')

  return {
    version: '0.0.0',
    clips,
    noteType,
    audioFileName,
  }
}
