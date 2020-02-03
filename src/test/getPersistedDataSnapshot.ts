import tempy from 'tempy'
import { join, basename } from 'path'
import { copyFile, remove, existsSync, mkdirp } from 'fs-extra'

type Directories = {
  ASSETS_DIRECTORY: string
  TMP_DIRECTORY: string
  GENERATED_ASSETS_DIRECTORY: string
}

export function getPersistedDataSnapshot(
  state: AppState,
  testId: string,
  directories: Directories
) {
  const newPersistedDataSnapshot = {
    fileAvailabilities: state.fileAvailabilities,
    // TODO: settings
  }
  const generatedFilePaths: string[] = []
  for (const [, availabilities] of Object.entries(
    newPersistedDataSnapshot.fileAvailabilities
  )) {
    // replace filepaths with template strings
    // to be converted later into code for dynamic filepaths
    for (const [id, f] of Object.entries(availabilities)) {
      if (!f) throw new Error(`File ${id} is undefined`)

      if (f.filePath && f.filePath.startsWith(tempy.root)) {
        generatedFilePaths.push(f.filePath)
        availabilities[id] = {
          ...f,
          filePath: filePathTemplate(
            'GENERATED_ASSETS_DIRECTORY',
            f.filePath.replace(tempy.root, '')
          ),
        }
      } else if (f.filePath && f.filePath.includes(directories.TMP_DIRECTORY)) {
        availabilities[id] = {
          ...f,
          filePath: filePathTemplate(
            'TMP_DIRECTORY',
            f.filePath.replace(directories.TMP_DIRECTORY, '')
          ),
        }
      } else if (
        f.filePath &&
        f.filePath.includes(directories.ASSETS_DIRECTORY)
      ) {
        availabilities[id] = {
          ...f,
          filePath: filePathTemplate(
            'ASSETS_DIRECTORY',
            f.filePath.replace(directories.ASSETS_DIRECTORY, '')
          ),
        }
      }
    }
  }

  const generatedAssetsSubdirectory = join(
    directories.GENERATED_ASSETS_DIRECTORY,
    testId
  )
  const keepTmpFiles = async () => {
    console.log('Removing old tmp files from ' + generatedAssetsSubdirectory)
    if (existsSync(generatedAssetsSubdirectory))
      await remove(generatedAssetsSubdirectory)
    await mkdirp(generatedAssetsSubdirectory)

    console.log(
      `Copying tmp files from ${tempy.root} to ${generatedAssetsSubdirectory}`
    )
    for (const filePath of generatedFilePaths) {
      console.log('Copying ' + filePath)
      const newFilePath = join(generatedAssetsSubdirectory, basename(filePath))
      copyFile(filePath, newFilePath)
    }

    console.log('Done!')
  }

  return {
    json: JSON.stringify(newPersistedDataSnapshot, null, 2)
      .replace(/"###/g, '')
      .replace(/###"/g, ''),
    tmpFiles: generatedFilePaths,
    keepTmpFiles,
  }
}

function filePathTemplate(
  newDirectoryIdentifier: keyof Directories,
  newFileName: string
) {
  return `###join(${newDirectoryIdentifier}, '${newFileName}')###`
}
