const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer')

module.exports = function installDevtools() {
  return Promise.all([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].map(extension =>
    installExtension(extension)
      .then((name) => console.log(`Added Extensions:  ${name}`))
      .catch((err) => console.log('An error occurred adding an extension: ', err)
    ))
  )
}
