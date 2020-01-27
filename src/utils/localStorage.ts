export const saveProjectToLocalStorage = (project: Project4_1_0) => {
  localStorage.setItem('project_' + project.id, JSON.stringify(project))
}
