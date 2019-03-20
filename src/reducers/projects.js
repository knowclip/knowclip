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

    default:
      return state
  }
}

export default projects
