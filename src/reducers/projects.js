// @flow

const initialState: ProjectsState = {
  byId: {},
  allIds: [],
}

const projects: Reducer<ProjectsState> = (state = initialState, action) => {
  switch (action.type) {
    //   case typeName:
    //     return { ...state, ...payload }

    default:
      return state
  }
}

export default projects
