import electron from 'electron'

const {
  remote: { dialog },
} = electron

export const showSaveDialog = (name, extensions) =>
  new Promise((res, rej) => {
    try {
      dialog.showSaveDialog({ filters: [{ name, extensions }] }, filename => {
        res(filename)
      })
    } catch (err) {
      rej(err)
    }
  })
