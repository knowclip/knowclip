// @flow

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

    default:
      return state
  }
}

export default projects
