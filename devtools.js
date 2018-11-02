const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer')

module.exports = function installDevtools() {
  return Promise.all([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS].map(installExtension))
    .then((names) => console.log(`Added Extensions:  ${names.join(', ')}`))
    .catch((err) => console.log('An error occurred: ', err));
}
