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
import { afterAll, beforeAll, describe } from 'vitest'

const testId = 'savedProject'

describe('make a project file for testing saved projects', () => {
  const context = initTestContext(testId)

  beforeAll(async () => {
    const { app } = await startApp(context)

    await mockSideEffects(app, sideEffectsMocks)
  })

  runAll(
    newProjectTestSteps({
      projectFileName: 'my_previously_saved_project',
      projectTitle: 'My cool saved project',
      projectId: '91bfd159-155c-4b61-bdd5-d71e2e944773',
      mediaFileIds: [
        '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
      ],
      clipIds: [
        '632a6cff-7fd7-4d0f-b657-0b9636204261',
        'a272b282-4d89-4af0-9d17-baa807793f1f',
        '6fce08e8-9312-4930-9601-c14b470e57ab',
      ],
      subtitlesTrackIds: [
        'd680807d-3a5f-4a25-967f-71871b7d5057',
        'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
      ],
    }),
    context
  )

  afterAll(async () => {
    await copyFile(
      join(context.temporaryDirectory, 'my_previously_saved_project.kyml'),
      join(FIXTURES_DIRECTORY, 'my_previously_saved_project.kyml')
    )

    if (context.setup) await context.setup.logPersistedData()
    else
      console.error('Could not log persisted data while running app not found')

    await stopApp(context)
  })
})
const sideEffectsMocks = {
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
