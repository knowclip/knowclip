// @flow
import fs from 'fs'
import { promisify } from 'util'
import { initialState as initialNoteTypeState } from '../reducers/noteTypes'

export const persistState = state => {
  const { audio, clips, noteTypes } = state
  window.localStorage.setItem('audio', JSON.stringify(audio))
  // window.localStorage.setItem('clips', JSON.stringify(clips))
  window.localStorage.setItem('noteTypes', JSON.stringify(noteTypes))
}

// export const getPersistedState = () => {
//   const persistedState = {}
//   const stateParts = ['audio', 'clips', 'noteTypes']
//   stateParts.forEach(x => {
//     const stored = JSON.parse(window.localStorage.getItem(x))
//     if (!stored) return
//     persistedState[x] = stored
//   })
//   return persistedState
// }

const areNoteTypesEqual = (a: NoteType, b: NoteType): boolean =>
  a.id === b.id &&
  a.name == b.name &&
  a.fields.length === b.fields.length &&
  a.fields.every(
    (field, i) => field.id === b.fields[i].id && field.name === b.fields[i].name
  )

export const hydrate = (
  project: Project0_0_0,
  audioFilePath: AudioFilePath,
  mediaFolderLocation: ?string,
  noteTypes: ?NoteTypesState
): $Shape<AppState> => {
  const localNoteType = noteTypes && noteTypes.byId[project.noteType.id]
  const noteType =
    !localNoteType || areNoteTypesEqual(localNoteType, project.noteType)
      ? project.noteType
      : {
          ...project.noteType,
          id: `${project.noteType.id}_fork`,
          name: `${project.noteType.name}_fork`,
        }
  const noteTypesBase = noteTypes || initialNoteTypeState
  return {
    audio: {
      loop: true,
      files: {
        [audioFilePath]: {
          path: audioFilePath,
          noteTypeId: noteType.id,
        },
      },
      filesOrder: [audioFilePath],
      currentFileIndex: 0,
      isLoading: false,
      mediaFolderLocation,
    },
    clips: {
      idsByFilePath: {
        [audioFilePath]: Object.keys(project.clips).sort(
          (a, b) => project.clips[a].start - project.clips[b].start
        ),
      },
      byId: Object.keys(project.clips).reduce(
        (all, clipId) => ({
          ...all,
          [clipId]: { ...project.clips[clipId], filePath: [audioFilePath] },
        }),
        ({}: { [ClipId]: Clip })
      ),
    },
    noteTypes: {
      ...noteTypesBase,
      byId: {
        ...noteTypesBase.byId,
        [noteType.id]: noteType,
      },
      allIds: [...new Set(noteTypesBase.allIds.concat(noteType.id))],
    },
  }
}

const getJsonPath = filePath => `${filePath}.afca.json`
export const getPersistedState = (): $Shape<AppState> => {
  const persistedState = ({}: $Shape<{
    audio: AudioState,
    noteTypes: NoteTypesState,
  }>)
  try {
    const stateParts = ['audio', 'noteTypes']
    stateParts.forEach(x => {
      const stored = JSON.parse(window.localStorage.getItem(x))
      if (!stored) return
      persistedState[x] = stored
    })
    const filePath =
      persistedState &&
      persistedState.audio &&
      persistedState.audio.filesOrder &&
      persistedState.audio.filesOrder[0]
    const mediaFolderLocation =
      persistState &&
      persistState.audio &&
      persistState.audio.mediaFolderLocation
    const jsonPath = getJsonPath(filePath)
    const jsonExists = filePath && fs.existsSync(jsonPath)
    if (jsonExists) {
      const jsonFileContents = fs.readFileSync(jsonPath, 'utf8')
      const project = JSON.parse(jsonFileContents)
      return hydrate(
        project,
        filePath,
        mediaFolderLocation,
        persistedState.noteTypes
      )
    }
  } catch (err) {
    console.error(err)
    return { noteTypes: persistedState.noteTypes }
  }
}
