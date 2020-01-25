import { Application } from 'spectron'
import { startApp, stopApp, TestSetup } from '../../spectronApp'
import openSharedProject from './openSharedProject'
import navigateBetweenMedia from './navigateBetweenMedia'
import makeFlashcardsWithSubtitles from './makeFlashcardsWithSubtitles'
import manuallyLocateAsset from './manuallyLocateAsset'
import reviewWithMissingMedia from './reviewWithMissingMedia'
import exportWithMissingMedia from './exportWithMissingMedia'
import saveAndCloseProject from './saveAndCloseProject'
import { mockSideEffects } from '../../../utils/sideEffects'

jest.setTimeout(60000)

describe('opening a shared project', () => {
  let context: { app: Application | null } = { app: null }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context, 'sharedProject')

    await mockSideEffects(setup.app, sideEffectsMocks)
  })

  test('open a shared project and locates media in local filesystem', () =>
    openSharedProject(setup))
  test('navigate between as-of-yet unloaded media', () =>
    navigateBetweenMedia(setup))
  test('make some flashcards', () => makeFlashcardsWithSubtitles(setup))
  test('manually locate missing assets', () => manuallyLocateAsset(setup))
  test('review with missing media', () => reviewWithMissingMedia(setup))
  test('export deck with missing media', () => exportWithMissingMedia(setup))
  test('save and close project', () => saveAndCloseProject(setup))

  afterAll(async () => {
    await stopApp(context)
  })
})

const sideEffectsMocks = {
  uuid: [
    '64bc9fe8-822a-4ecf-83d9-d6997029db7d',
    'b9ba2184-cb5c-4d50-98c2-568bf8e75854',
  ],
  nowUtcTimestamp: [
    '2020-01-24T15:09:02Z',
    '2020-01-24T15:09:03Z',
    '2020-01-24T15:09:18Z',
  ],
}
