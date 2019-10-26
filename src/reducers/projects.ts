import { Reducer } from 'redux'
import deleteKey from '../utils/deleteKey'

const initialState: ProjectsState = {
  byId: {},
  allIds: [],
}

const projects: Reducer<ProjectsState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.OPEN_PROJECT:
      return {
        ...state,
        byId: { ...state.byId, [action.project.id]: action.projectMetadata },
        allIds: [
          action.project.id,
          ...state.allIds.filter(id => id !== action.project.id),
        ],
      }

    case A.SET_PROJECT_NAME:
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

    case A.CREATE_PROJECT:
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.projectMetadata.id]: action.projectMetadata,
        },
        allIds: [action.projectMetadata.id, ...state.allIds],
      }

    // case A.ADD_MEDIA_TO_PROJECT:
    case A.ADD_FILE:
      if (action.fileRecord.type === 'MediaFile') {
        const projectId = action.fileRecord.parentId
        return {
          ...state,
          byId: {
            ...state.byId,
            [projectId]: {
              ...state.byId[projectId],
              mediaFiles: [
                ...state.byId[projectId].mediaFiles,
                action.fileRecord.id,
              ],
            },
          },
        }
      }
      return state

    case A.DELETE_MEDIA_FROM_PROJECT:
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.projectId]: {
            ...state.byId[action.projectId],
            mediaFiles: state.byId[action.projectId].mediaFiles.filter(
              id => id !== action.mediaFileId
            ),
          },
        },
      }

    case A.REMOVE_PROJECT_FROM_RECENTS:
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
