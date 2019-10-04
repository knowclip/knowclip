import { Reducer } from 'redux'
import deleteKey from '../utils/deleteKey'

const initialState: ProjectsState = {
  byId: ({}),
  allIds: ([]),
}

const editMediaFilePath = (
  state: ProjectsState,
  projectId: ProjectId,
  mediaFileId: MediaFileId,
  edit: (metadataAndPath: AudioMetadataAndPath) => AudioMetadataAndPath
) => ({
  ...state,
  byId: {
    ...state.byId,
    [projectId]: {
      ...state.byId[projectId],
      mediaFilePaths: state.byId[projectId].mediaFilePaths.map(p =>
        p.metadata.id === mediaFileId ? edit(p) : p
      ),
    },
  },
})

const projects: Reducer<ProjectsState, Action> = (state = initialState, action) => {
  switch (action.type) {
    case 'OPEN_PROJECT':
      return {
        ...state,
        byId: { ...state.byId, [action.project.id]: action.projectMetadata },
        allIds: [
          action.project.id,
          ...state.allIds.filter(id => id !== action.project.id),
        ],
      }

    case 'SET_PROJECT_NAME':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.id]: {
            ...state.byId[action.id],
            name: action.name,
          },
        },
      }

    case 'CREATE_PROJECT':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.projectMetadata.id]: action.projectMetadata,
        },
        allIds: [action.projectMetadata.id, ...state.allIds],
      }

    case 'ADD_MEDIA_TO_PROJECT':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.projectId]: {
            ...state.byId[action.projectId],
            mediaFilePaths: [
              ...state.byId[action.projectId].mediaFilePaths,
              ...action.mediaFilePaths,
            ],
          },
        },
      }

    case 'DELETE_MEDIA_FROM_PROJECT':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.projectId]: {
            ...state.byId[action.projectId],
            mediaFilePaths: state.byId[action.projectId].mediaFilePaths.filter(
              ({ metadata }) => metadata.id !== action.mediaFileId
            ),
          },
        },
      }

    case 'LOCATE_MEDIA_FILE_SUCCESS':
      return editMediaFilePath(
        state,
        action.projectId,
        action.metadata.id,
        mediaFileAndPath => ({
          ...mediaFileAndPath,
          filePath: action.filePath,
          metadata: action.metadata,
        })
      )

    case 'OPEN_MEDIA_FILE_SUCCESS':
      return editMediaFilePath(
        state,
        action.projectId,
        action.metadata.id,
        mediaFileAndPath => ({
          ...mediaFileAndPath,
          filePath: action.filePath,
          metadata: action.metadata,
          constantBitrateFilePath: action.constantBitrateFilePath,
        })
      )

    case 'REMOVE_PROJECT_FROM_RECENTS':
      return {
        ...state,
        byId: deleteKey(state.byId, action.id),
        allIds: state.allIds.filter(id => id !== action.id),
      }

    default:
      return state
  }
}

export default projects
