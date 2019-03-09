// @flow
import fs from 'fs'
import { initialState as initialNoteTypeState } from '../reducers/noteTypes'

export const persistState = (state: AppState) => {
  const { audio, noteTypes } = state
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
  a.name === b.name &&
  a.fields.length === b.fields.length &&
  a.fields.every(
    (field, i) => field.id === b.fields[i].id && field.name === b.fields[i].name
  )

export const hydrateFromProjectFile = (
  existingProjectFilePath: string,
  audioFilePath: AudioFilePath,
  mediaFolderLocation: ?string,
  noteTypes: ?NoteTypesState
): $Shape<AppState> => {
  const jsonFileContents = fs.readFileSync(existingProjectFilePath, 'utf8')
  const project: Project0_0_0 = JSON.parse(jsonFileContents)

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
          [clipId]: {
            ...project.clips[clipId],
            filePath: audioFilePath,
            flashcard: {
              ...project.clips[clipId].flashcard,
              tags: project.clips[clipId].flashcard.tags || [],
            },
          },
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

export const getProjectFilePath = (filePath: AudioFilePath): string =>
  `${filePath}.afca`
export const findExistingProjectFilePath = (
  filePath: AudioFilePath
): ?string => {
  const jsonPath = getProjectFilePath(filePath)
  return filePath && fs.existsSync(jsonPath) ? jsonPath : null
}

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
      persistedState &&
      persistedState.audio &&
      persistedState.audio.mediaFolderLocation
    const projectFilePath = findExistingProjectFilePath(filePath)
    if (projectFilePath) {
      return hydrateFromProjectFile(
        projectFilePath,
        filePath,
        mediaFolderLocation,
        persistedState.noteTypes
      )
    } else return { noteTypes: persistedState.noteTypes }
  } catch (err) {
    console.error(err)
    return { noteTypes: persistedState.noteTypes }
  }
}
