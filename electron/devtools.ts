import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-extension-installer'

export default async function installDevtools({
  react,
  redux,
}: {
  react: boolean
  redux: boolean
}) {
  if (redux)
    await installExtension(REDUX_DEVTOOLS, {
      loadExtensionOptions: { allowFileAccess: true },
    })
  if (react)
    await installExtension(REACT_DEVELOPER_TOOLS, {
      loadExtensionOptions: { allowFileAccess: true },
    })
}
