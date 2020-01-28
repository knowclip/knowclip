function getStoredFileData(
  testId,
  projectFileName,
  projectName,
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

  const projectAvailabilities = Object.entries(
    parsed.fileAvailabilities.ProjectFile
  )
  const projects = Object.entries(parsed.files.ProjectFile)
  if (projectAvailabilities.length !== 1 || projects.length !== 1)
    throw new Error('Should only be one project file')
  projectAvailabilities[0][1].filePath = `###join(TMP_DIRECTORY, \`${projectFileName}.afca\`)###`
  projects[0][1].name = projectName

  console.log(
    JSON.stringify(parsed)
      .replace(/"###/g, '')
      .replace(/###"/g, '')
  )

  console.log(
    `rm  ${assetsDir}generated/${testId}/** && (cd ${tmpDir} && cp ${generated.join(
      ' '
    )} ${assetsDir}generated/${testId})`
  )
}
getStoredFileData(
  'sharedProject',
  'project_with_subtitles',
  'Project with subtitles'
)
