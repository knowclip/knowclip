import electron from 'electron'
import { getPersistedDataSnapshot } from '../test/getPersistedDataSnapshot'
import { writeFileSync } from 'fs-extra'
import { join } from 'path'

export const saveProjectToLocalStorage = (project: Project4_1_0) => {
  localStorage.setItem('project_' + project.id, JSON.stringify(project))
}
console.log(
  'should say "will log!"',
  process.env.NODE_ENV,
  JSON.stringify(process.env.REACT_APP_SPECTRON)
)
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_SPECTRON) {
  window.document.addEventListener('DOMContentLoaded', () => {
    electron.ipcRenderer.on('log-persisted-data', (e, testId, directories) => {
      const snapshot = getPersistedDataSnapshot(testId, directories)

      console.log(snapshot)
      snapshot.keepTmpFiles()
      console.log(snapshot.localStorageSnapshot)

      writeFileSync(
        join(process.cwd(), testId + '_persistedDataSnapshot.js'),
        snapshot.localStorageSnapshot
      )
    })
  })
}
