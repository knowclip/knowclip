import { Application } from 'spectron'
import { join } from 'path'
import electron from 'electron'
import { testLabels as projectsMenu } from '../components/ProjectsMenu'
import { testLabels as newProjectForm } from '../components/Dialog/NewProjectFormDialog'
import { remove, copy } from 'fs-extra'

jest.setTimeout(60000)

describe('App', () => {
  let context: { app: Application | null } = { app: null }

  beforeAll(async () => {
    const tmpDirectory = join(process.cwd(), 'test-tmp')
    // await remove(tmpDirectory)

    await copy(join(__dirname, 'fixtures'), tmpDirectory)
  })

  afterEach(() => {
    const { app } = context
    if (app && app.isRunning()) {
      app.mainProcess.exit(0)
    }
  })

  it('creates new project file', async () => {
    const { app, $id } = await setUpApp(context, {
      showSaveDialog: join(process.cwd(), 'test-tmp', 'my_cool_project.afca'),
    })

    $id(projectsMenu.newProjectButton).click()

    await app.client.waitForExist('#' + newProjectForm.projectNameField)

    await $id(newProjectForm.projectNameField).setValue('My cool project')
    $id(newProjectForm.projectFileLocationField).click()
    $id(newProjectForm.noteTypeSelect).click()
    await app.client.waitForExist(
      '#' + newProjectForm.transcriptionNoteTypeOption
    )

    await $id(newProjectForm.transcriptionNoteTypeOption).click()

    await app.client.waitUntilTextExists(
      'body',
      'Includes fields for transcription, pronunciation, meaning, and notes. Especially useful when learning a language with a different writing system.'
    )

    await app.client.waitUntil(
      async () =>
        !(await app.client.isExisting(
          '#' + newProjectForm.transcriptionNoteTypeOption
        ))
    )

    await app.client.waitForVisible('#' + newProjectForm.saveButton)

    await $id(newProjectForm.saveButton).click()

    await tearDownApp(context)
  })
})

async function setUpApp(
  context: {
    app: Application | null
  },
  mocks?: any
): Promise<{
  app: Application
  $id: (
    id: string
  ) => WebdriverIO.Client<WebdriverIO.RawResult<WebdriverIO.Element>> &
    WebdriverIO.RawResult<WebdriverIO.Element>
}> {
  const app = new Application({
    chromeDriverArgs: ['--disable-extensions', '--debug'],
    path: (electron as unknown) as string,
    env: { NODE_ENV: 'test', SPECTRON: process.env.REACT_APP_SPECTRON },
    args: [join(__dirname, '..', '..'), '-r', join(__dirname, 'mocks.js')],
  })

  context.app = app

  await app.start()

  if (mocks) {
    await app.client.waitUntilWindowLoaded()
    for (const [functionName, returnValue] of Object.entries(mocks))
      app.webContents.send('mock', functionName, returnValue)
  }

  const $id = (
    id: string
  ): WebdriverIO.Client<WebdriverIO.RawResult<WebdriverIO.Element>> &
    WebdriverIO.RawResult<WebdriverIO.Element> => app.client.$('#' + id)
  return {
    app,
    $id,
  }
}

async function tearDownApp(context: {
  app: Application | null
}): Promise<null> {
  const { app } = context
  if (app) await app.stop()

  context.app = null

  if (app) app.webContents.send('reset-mocks')

  return null
}
