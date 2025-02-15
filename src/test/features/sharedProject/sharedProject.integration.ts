import { initTestContext, startApp, stopApp } from '../../setUpDriver'
import openSharedProject from './openSharedProject'
import navigateBetweenMedia from './navigateBetweenMedia'
import makeFlashcards from './makeFlashcards'
import makeFlashcardsWithSubtitles from './makeFlashcardsWithSubtitles'
import manuallyLocateAsset from './manuallyLocateAsset'
import reviewWithMissingMedia from './reviewWithMissingMedia'
import exportWithMissingMedia from './exportWithMissingMedia'
import saveAndCloseProject from './saveAndCloseProject'
import { mockSideEffects } from '../../mockSideEffects'
import { runAll, step } from '../step'
import { describe, beforeAll, afterAll } from 'vitest'

const testId = 'sharedProject'

describe('opening a shared project', () => {
  const context = initTestContext(testId)

  beforeAll(async () => {
    const { app } = await startApp(context, 9517)

    await mockSideEffects(app, sideEffectsMocks)
  })

  runAll(
    [
      ...sharedProjectTestSteps('786f7023-0862-4cf7-863f-2c32ec6a3975', [
        '64bc9fe8-822a-4ecf-83d9-d6997029db7d',
        'b9ba2184-cb5c-4d50-98c2-568bf8e75854',
      ]),
      step('save and close project', (context) => saveAndCloseProject(context)),
    ],
    context
  )

  afterAll(async () => {
    await stopApp(context)
  })
})

function sharedProjectTestSteps(
  firstExistingClipId: string,
  newClipIds: [string, string]
) {
  return [
    step(
      'open a shared project and locates media in local filesystem',
      openSharedProject
    ),
    step('navigate between as-of-yet unloaded media', navigateBetweenMedia),
    step('make some flashcards', (context) =>
      makeFlashcards(context, firstExistingClipId, newClipIds[0])
    ),
    step('make some flashcards using subtitles', (context) =>
      makeFlashcardsWithSubtitles(context, newClipIds[1])
    ),
    step('manually locate missing assets', manuallyLocateAsset),
    step('review with missing media', reviewWithMissingMedia),
    step('export deck with missing media', exportWithMissingMedia),
  ]
}

const sideEffectsMocks = {
  nowUtcTimestamp: [
    '2020-01-24T15:09:02Z',
    '2020-01-24T15:09:03Z',
    '2020-01-24T15:09:18Z',
    '2020-02-02T15:26:22Z',
    '2020-02-02T15:26:22Z',
    '2020-02-02T15:26:24Z',
    '2020-02-02T15:26:24Z',
    '2020-02-02T15:26:24Z',
    '2020-02-02T15:26:26Z',
    '2020-02-02T15:26:28Z',
    '2020-02-02T15:26:29Z',
    '2020-02-02T15:26:29Z',
    '2020-02-02T15:26:30Z',
    '2020-02-02T15:26:34Z',
    '2020-02-02T15:26:34Z',
    '2020-02-02T15:26:39Z',
    '2020-02-02T15:26:39Z',
    '2020-02-02T15:26:39Z',
    '2020-02-02T15:26:39Z',
    '2020-02-02T15:26:39Z',
    '2020-02-02T15:26:39Z',
  ],
}
