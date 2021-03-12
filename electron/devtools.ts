// @ts-ignore
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer'
const { app } = require('electron')

export default function installDevtools() {
  return app.whenReady().then(() =>
    Promise.all(
      [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].map((extension) =>
        installExtension(extension)
          .then((name: any) => console.log(`Added Extensions:  ${name}`))
          .catch((err: any) =>
            console.log('An error occurred adding an extension: ', err)
          )
      )
    )
  )
}
