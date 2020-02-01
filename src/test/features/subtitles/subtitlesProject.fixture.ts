import { Application } from 'spectron'
import {
  startApp,
  stopApp,
  TestSetup,
  TMP_DIRECTORY,
  FIXTURES_DIRECTORY,
} from '../../spectronApp'
import { mockSideEffects } from '../../../utils/sideEffects'
import { runAll } from '../step'
import { newProjectTestSteps } from '../newProject/newProjectTestSteps'
import { copyFile } from 'fs-extra'
import { join } from 'path'
import { savedProjectTestSteps } from '../savedProject/savedProjectTestSteps'

jest.setTimeout(60000)

const testId = 'sharedProject'

describe('make a project file for testing generating clips from subtitles', () => {
  let context: { app: Application | null; testId: string } = {
    app: null,
    testId,
  }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context)
    await mockSideEffects(setup.app, sideEffectsMocks)
  })

  runAll(
    [
      ...newProjectTestSteps({
        projectFileName: 'project_with_subtitles',
        projectTitle: 'Project with subtitles',
      }),
      ...savedProjectTestSteps({
        projectTitle: 'Project with subtitles',
      }),
    ],
    () => setup
  )

  afterAll(async () => {
    await copyFile(
      join(TMP_DIRECTORY, 'project_with_subtitles.afca'),
      join(FIXTURES_DIRECTORY, 'project_with_subtitles.afca')
    )

    await setup.logPersistedData()

    await stopApp(context)
  })
})
const sideEffectsMocks = {
  uuid: [
    'ef3a2602-37a0-4158-89d6-47b75edb5bea',
    'bd8aca85-de21-4666-bbab-a33fd21d03f1',
    '5f581055-dbf5-4f3b-bcee-a3215e405ffc',
    'a8b64692-dba0-4ef4-b5e7-8c887956a69a',
    '6b02575a-0a4f-402a-8ea3-31f457cb5d8c',
    'ff54865f-ef52-4f16-9f20-2ae257eceb40',
    'a3a0c3eb-3841-4d2f-851a-5af95cd14855',
    'f5053503-8e5f-45c3-9afc-26f5e6eab8a8',
    '152077c6-336b-47d6-88e6-1ba4410db553',
    '864d822f-d482-438e-9620-684b2730a688',
    'c9723266-41d2-4676-884f-a811ec89c786',
  ],
  nowUtcTimestamp: [
    '2020-02-01T16:10:37Z',
    '2020-02-01T16:10:37Z',
    '2020-02-01T16:10:37Z',
    '2020-02-01T16:10:37Z',
    '2020-02-01T16:10:37Z',
    '2020-02-01T16:10:40Z',
    '2020-02-01T16:10:41Z',
    '2020-02-01T16:10:42Z',
    '2020-02-01T16:10:42Z',
    '2020-02-01T16:10:42Z',
    '2020-02-01T16:10:44Z',
    '2020-02-01T16:10:54Z',
    '2020-02-01T16:10:54Z',
    '2020-02-01T16:11:10Z',
    '2020-02-01T16:11:11Z',
    '2020-02-01T16:11:12Z',
    '2020-02-01T16:11:12Z',
    '2020-02-01T16:11:12Z',
    '2020-02-01T16:11:12Z',
    '2020-02-01T16:11:12Z',
    '2020-02-01T16:11:12Z',
    '2020-02-01T16:11:16Z',
    '2020-02-01T16:11:16Z',
    '2020-02-01T16:11:16Z',
    '2020-02-01T16:11:16Z',
    '2020-02-01T16:11:17Z',
    '2020-02-01T16:11:17Z',
    '2020-02-01T16:11:17Z',
    '2020-02-01T16:11:17Z',
    '2020-02-01T16:11:17Z',
    '2020-02-01T16:11:17Z',
    '2020-02-01T16:11:18Z',
    '2020-02-01T16:11:18Z',
    '2020-02-01T16:11:18Z',
    '2020-02-01T16:11:19Z',
    '2020-02-01T16:11:24Z',
    '2020-02-01T16:11:27Z',
    '2020-02-01T16:11:28Z',
    '2020-02-01T16:11:28Z',
    '2020-02-01T16:11:28Z',
    '2020-02-01T16:11:28Z',
    '2020-02-01T16:11:28Z',
    '2020-02-01T16:11:30Z',
    '2020-02-01T16:11:30Z',
    '2020-02-01T16:11:30Z',
    '2020-02-01T16:11:30Z',
  ],
}
