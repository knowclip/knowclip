import { Application } from 'spectron'
import { startApp, stopApp, TestSetup } from '../../spectronApp'
import createNewProject from './createNewProject'
import changeProjectName from './changeProjectName'
import addFirstMediaToProject from './addFirstMediaToProject'
import makeSomeFlashcards from './makeSomeFlashcards'
import navigateBetweenClips from './navigateBetweenClips'
import addMoreMediaToProject from './addMoreMediaToProject'
import navigateBetweenMedia from './navigateBetweenMedia'
import reviewAndExportApkg from './reviewAndExportApkg'
import moveThroughoutMedia from './moveThroughoutMedia'
import saveAndCloseProject from './saveAndCloseProject'
import { mockSideEffects } from '../../../utils/sideEffects'
import addSomeSubtitles from './addSomeSubtitles'

jest.setTimeout(60000)

describe('create a deck from a new project', () => {
  let context: { app: Application | null } = { app: null }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context, 'newProjectTest')

    await mockSideEffects(setup.app, sideEffectsMocks)
  })

  test('create a new project', async () => {
    return createNewProject(setup)
  }) // should create file
  test('change project name', () => changeProjectName(setup))
  test('add media to project', () => addFirstMediaToProject(setup))
  test('add a subtitles file', () => addSomeSubtitles(setup))
  test('create clips + flashcards', () => makeSomeFlashcards(setup))
  test('navigate between clips', () => navigateBetweenClips(setup))
  test('move throughout media file', () => moveThroughoutMedia(setup))
  test('add more media to project', () => addMoreMediaToProject(setup))
  test('navigate between media', () => navigateBetweenMedia(setup))
  test('exporting an .apkg', () => reviewAndExportApkg(setup))
  test('saving a project file', () => saveAndCloseProject(setup))

  afterAll(async () => {
    await stopApp(context)
  })
})

const sideEffectsMocks = {
  uuid: [
    '6f58206b-9384-411c-8432-e7ff8d6c958b',
    '5b0db4e9-a28f-4499-9cd7-d775f4eb7cb0',
    '7077af99-722b-4737-854e-d2d1a3a3a60f',
    'a517b52e-e10b-4e9e-90e1-bfecc865b428',
    '8e92ca1d-8d29-486b-81d1-0a44d2da8366',
    'a1eb3142-ce18-4595-a3c3-8c867e1058f4',
    '3eb212dd-8f04-4c63-b36a-06a0bb6957aa',
    '906db000-f3d2-46c9-9ec9-0a1069304e41',
  ],
  nowUtcTimestamp: [
    '2020-01-28T12:35:20Z',
    '2020-01-28T12:35:20Z',
    '2020-01-28T12:35:20Z',
    '2020-01-28T12:35:49Z',
  ],
}
