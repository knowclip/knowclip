import {
  startApp,
  stopApp,
  TestSetup,
  TMP_DIRECTORY,
  FIXTURES_DIRECTORY,
} from '../../setUpDriver'
import { mockSideEffects } from '../../../utils/sideEffects'
import { runAll } from '../step'
import { newProjectTestSteps } from '../newProject/newProjectTestSteps'
import { copyFile } from 'fs-extra'
import { join } from 'path'
import { TestDriver } from '../../driver/TestDriver'

jest.setTimeout(60000)

const testId = 'savedProject'

describe('make a project file for testing saved projects', () => {
  let context: { app: TestDriver | null; testId: string } = {
    app: null,
    testId,
  }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context)
    await mockSideEffects(setup.app, sideEffectsMocks)
  })

  runAll(
    newProjectTestSteps({
      projectFileName: 'my_previously_saved_project',
      projectTitle: 'My cool saved project',
    }),
    () => setup
  )

  afterAll(async () => {
    await copyFile(
      join(TMP_DIRECTORY, 'my_previously_saved_project.kyml'),
      join(FIXTURES_DIRECTORY, 'my_previously_saved_project.kyml')
    )

    await setup.logPersistedData()

    await stopApp(context)
  })
})
const sideEffectsMocks = {
  uuid: [
    '91bfd159-155c-4b61-bdd5-d71e2e944773',
    '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
    'd680807d-3a5f-4a25-967f-71871b7d5057',
    'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
    '632a6cff-7fd7-4d0f-b657-0b9636204261',
    'a272b282-4d89-4af0-9d17-baa807793f1f',
    '6fce08e8-9312-4930-9601-c14b470e57ab',
    'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
  ],
  nowUtcTimestamp: [
    '2020-02-01T13:20:55Z',
    '2020-02-01T13:20:55Z',
    '2020-02-01T13:20:55Z',
    '2020-02-01T13:20:55Z',
    '2020-02-01T13:20:55Z',
    '2020-02-01T13:20:57Z',
    '2020-02-01T13:20:57Z',
    '2020-02-01T13:20:58Z',
    '2020-02-01T13:20:58Z',
    '2020-02-01T13:20:59Z',
    '2020-02-01T13:21:00Z',
    '2020-02-01T13:21:08Z',
    '2020-02-01T13:21:08Z',
    '2020-02-01T13:21:19Z',
    '2020-02-01T13:21:20Z',
    '2020-02-01T13:21:20Z',
    '2020-02-01T13:21:21Z',
    '2020-02-01T13:21:21Z',
    '2020-02-01T13:21:21Z',
    '2020-02-01T13:21:21Z',
    '2020-02-01T13:21:21Z',
    '2020-02-01T13:21:24Z',
    '2020-02-01T13:21:24Z',
    '2020-02-01T13:21:24Z',
    '2020-02-01T13:21:24Z',
  ],
}
