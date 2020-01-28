function getStoredFileData(
  testId,
  tmpDir = '/tmp/',
  assetsDir = '/home/justin/code/knowclip/src/test/assets/',
  tmpTestDir = '/home/justin/code/knowclip/tmp-test/'
) {
  const parsed = {
    files: JSON.parse(localStorage.getItem('files')),
    fileAvailabilities: JSON.parse(localStorage.getItem('fileAvailabilities')),
  }
  const generated = []
  for (const [type, availabilities] of Object.entries(
    parsed.fileAvailabilities
  )) {
    for (const [id, f] of Object.entries(availabilities)) {
      if (f.filePath && f.filePath.startsWith('/tmp/')) {
        const fileName = f.filePath.replace(tmpDir, '')
        generated.push(fileName)
        availabilities[id] = {
          ...f,
          filePath: `###join(GENERATED_ASSETS_DIRECTORY, testId, '${fileName}')###`,
        }
      } else if (f.filePath && f.filePath.includes('tmp-test'))
        availabilities[id] = {
          ...f,
          filePath: `###join(TMP_DIRECTORY, '${f.filePath.replace(
            tmpTestDir,
            ''
          )}')###`,
        }
      else if (f.filePath && f.filePath.includes('assets'))
        availabilities[id] = {
          ...f,
          filePath: `###join(ASSETS_DIRECTORY, '${f.filePath.replace(
            assetsDir,
            ''
          )}')###`,
        }
    }
  }

  console.log(
    JSON.stringify(parsed)
      .replace(/"###/g, '')
      .replace(/###"/g, '')
  )

  console.log(
    `cd ${tmpDir} && cp ${generated.join(' ')} ${assetsDir}/generated/${testId}`
  )
}
getStoredFileData()
