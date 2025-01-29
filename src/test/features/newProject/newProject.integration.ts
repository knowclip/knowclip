import {
  initTestContext,
  startApp,
  stopApp,
  IntegrationTestContext,
} from '../../setUpDriver'
import { mockSideEffects } from '../../mockSideEffects'
import { runAll } from '../step'
import { newProjectTestSteps } from './newProjectTestSteps'
import { join } from 'path'
import { parseProjectJson } from '../../../node/parseProject'
import { describe, beforeAll, afterAll, test, expect } from 'vitest'

describe('create a deck from a new project', () => {
  const context: IntegrationTestContext = initTestContext('newProject')

  beforeAll(async () => {
    const { app } = await startApp(context, 9515)

    await mockSideEffects(app, sideEffectsMocks)
  })

  runAll(
    newProjectTestSteps({
      projectFileName: 'my_cool_new_project',
      projectTitle: 'My cool new project',
      projectId: '6f58206b-9384-411c-8432-e7ff8d6c958b',
      mediaFileIds: [
        '5b0db4e9-a28f-4499-9cd7-d775f4eb7cb0',
        '906db000-f3d2-46c9-9ec9-0a1069304e41',
      ],
      clipIds: [
        '8e92ca1d-8d29-486b-81d1-0a44d2da8366',
        'a1eb3142-ce18-4595-a3c3-8c867e1058f4',
        '3eb212dd-8f04-4c63-b36a-06a0bb6957aa',
      ],
      subtitlesTrackIds: [
        '7077af99-722b-4737-854e-d2d1a3a3a60f',
        'a517b52e-e10b-4e9e-90e1-bfecc865b428',
      ],
    }),
    context
  )

  test('resulting project file matches snapshot', async () => {
    const actualProjectFileContents = await parseProjectJson(
      join(context.temporaryDirectory, 'my_cool_new_project.kyml')
    )

    expect(actualProjectFileContents).toMatchSnapshot()
  })

  afterAll(async () => {
    await stopApp(context)
  })
})

const sideEffectsMocks = {
  nowUtcTimestamp: [
    '2020-01-28T12:35:20Z',
    '2020-01-28T12:35:20Z',
    '2020-01-28T12:35:20Z',
    '2020-01-28T12:35:49Z',
    '2020-01-31T14:26:39Z',
    '2020-01-31T14:26:40Z',
    '2020-01-31T14:26:41Z',
    '2020-01-31T14:26:42Z',
    '2020-01-31T14:26:42Z',
    '2020-01-31T14:26:43Z',
    '2020-01-31T14:26:44Z',
    '2020-01-31T14:26:52Z',
    '2020-01-31T14:26:52Z',
    '2020-01-31T14:27:03Z',
    '2020-01-31T14:27:04Z',
    '2020-01-31T14:27:04Z',
    '2020-01-31T14:27:05Z',
    '2020-01-31T14:27:05Z',
    '2020-01-31T14:27:05Z',
    '2020-01-31T14:27:05Z',
    '2020-01-31T14:27:05Z',
    '2020-01-31T14:27:08Z',
    '2020-01-31T14:27:08Z',
    '2020-01-31T14:27:08Z',
    '2020-01-31T14:27:08Z',
    '2020-01-31T14:29:18Z',
    '2020-01-31T14:29:18Z',
    '2020-01-31T14:29:18Z',
    '2020-01-31T14:29:18Z',
    '2020-01-31T14:29:18Z',
    '2020-01-31T14:29:18Z',
    '2020-01-31T14:29:18Z',
    '2020-01-31T14:29:19Z',
    '2020-01-31T14:29:19Z',
    '2020-01-31T14:29:19Z',
    '2020-01-31T14:29:19Z',
  ],
}
