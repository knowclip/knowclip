// @flow
import deleteKey from '../utils/deleteKey'

const initialState: ProjectsState = {
  byId: {},
  allIds: [],
}

const projects: Reducer<ProjectsState> = (state = initialState, action) => {
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
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.projectId]: {
            ...state.byId[action.projectId],
            mediaFilePaths: state.byId[action.projectId].mediaFilePaths.map(p =>
              p.metadata.id === action.id
                ? {
                    ...p,
                    filePath: action.filePath,
                    metadata: action.metadata,
                  }
                : p
            ),
          },
        },
      }

    case 'OPEN_MEDIA_FILE_SUCCESS':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.projectId]: {
            ...state.byId[action.projectId],
            mediaFilePaths: state.byId[action.projectId].mediaFilePaths.map(p =>
              p.metadata.id === action.metadata.id
                ? {
                    ...p,
                    filePath: action.filePath,
                    metadata: action.metadata,
                  }
                : p
            ),
          },
        },
      }

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
