import {
  startApp,
  stopApp,
  FIXTURES_DIRECTORY,
  initTestContext,
} from '../../setUpDriver'
import { mockSideEffects } from '../../mockSideEffects'
import { runAll } from '../step'
import { newProjectTestSteps } from '../newProject/newProjectTestSteps'
import { copyFile } from 'fs-extra'
import { join } from 'path'
import { savedProjectTestSteps } from '../savedProject/savedProjectTestSteps'
import { afterAll, beforeAll, describe } from 'vitest'

const testId = 'sharedProject'

describe('make a project file for testing shared projects', () => {
  const context = initTestContext(testId)

  beforeAll(async () => {
    const { app } = await startApp(context)

    await mockSideEffects(app, sideEffectsMocks)
  })

  runAll(
    [
      ...newProjectTestSteps({
        projectFileName: 'project_shared_with_me',
        projectTitle: "My friend's shared project",
        projectId: '2aeda2ce-af4b-48b4-9797-49015557f34f',
        mediaFileIds: [
          '71da02b1-12e7-47aa-8edf-868dbf33f0d3',
          '6fb35c19-02ed-42a7-b518-89f94273c028',
        ],
        clipIds: [
          '786f7023-0862-4cf7-863f-2c32ec6a3975',
          'b177def7-d7ca-4eae-ba97-03b92cba8657',
          '5bcf962d-b74f-4eb5-a973-20374b1ab470',
        ],
        subtitlesTrackIds: [
          '18d2d70a-a575-47b4-ad4c-5e1cb196aebc',
          '603cd2a3-1aa6-4964-88e2-7ed3e7c85d15',
        ],
      }),
      ...savedProjectTestSteps({
        projectTitle: "My friend's shared project",
        existingClipId: '786f7023-0862-4cf7-863f-2c32ec6a3975',
        newClipIds: [
          '08f0661f-ab1b-48d5-b64c-ef0afbcb9e83',
          'adda6b96-effd-463a-9998-509864e2f792',
          '916a81af-1d1b-4629-95cc-c451978a5edb',
        ],
      }),
    ],
    context
  )

  afterAll(async () => {
    await copyFile(
      join(context.temporaryDirectory, 'project_shared_with_me.kyml'),
      join(FIXTURES_DIRECTORY, 'project_shared_with_me.kyml')
    )

    if (context.setup) await context.setup.logPersistedData()
    else
      console.error('Could not log persisted data while running app not found')

    await stopApp(context)
  })
})
const sideEffectsMocks = {
  nowUtcTimestamp: [
    '2020-02-01T15:58:14Z',
    '2020-02-01T15:58:14Z',
    '2020-02-01T15:58:14Z',
    '2020-02-01T15:58:14Z',
    '2020-02-01T15:58:14Z',
    '2020-02-01T15:58:16Z',
    '2020-02-01T15:58:16Z',
    '2020-02-01T15:58:18Z',
    '2020-02-01T15:58:18Z',
    '2020-02-01T15:58:18Z',
    '2020-02-01T15:58:20Z',
    '2020-02-01T15:58:32Z',
    '2020-02-01T15:58:33Z',
    '2020-02-01T15:58:48Z',
    '2020-02-01T15:58:49Z',
    '2020-02-01T15:58:50Z',
    '2020-02-01T15:58:50Z',
    '2020-02-01T15:58:50Z',
    '2020-02-01T15:58:50Z',
    '2020-02-01T15:58:50Z',
    '2020-02-01T15:58:50Z',
    '2020-02-01T15:58:55Z',
    '2020-02-01T15:58:55Z',
    '2020-02-01T15:58:55Z',
    '2020-02-01T15:58:55Z',
    '2020-02-01T15:58:55Z',
    '2020-02-01T15:58:55Z',
    '2020-02-01T15:58:55Z',
    '2020-02-01T15:58:56Z',
    '2020-02-01T15:58:56Z',
    '2020-02-01T15:58:56Z',
    '2020-02-01T15:58:56Z',
    '2020-02-01T15:58:57Z',
    '2020-02-01T15:58:57Z',
    '2020-02-01T15:58:58Z',
    '2020-02-01T15:59:04Z',
    '2020-02-01T15:59:08Z',
    '2020-02-01T15:59:09Z',
    '2020-02-01T15:59:09Z',
    '2020-02-01T15:59:09Z',
    '2020-02-01T15:59:09Z',
    '2020-02-01T15:59:09Z',
    '2020-02-01T15:59:10Z',
    '2020-02-01T15:59:10Z',
    '2020-02-01T15:59:10Z',
    '2020-02-01T15:59:10Z',
  ],
}
