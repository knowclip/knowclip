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
    'e36ca6de-4893-49f5-bca1-4410ace25d46',
    '535935a3-7d72-4238-87ab-1b7a413c1f71',
    '37bd5e91-89c5-491b-9308-533c7be7338a',
    'ae3239c8-90bd-4488-95e3-bde059632348',
    '7c348315-8f78-42fd-9be7-b05bc0aade9d',
    'e62c823d-93c2-4a5e-8181-37e3d540c3e3',
    'fa462524-bfeb-4434-a506-07858cc97151',
  ],
  nowUtcTimestamp: [
    '2020-01-22T07:49:42Z',
    '2020-01-22T07:49:42Z',
    '2020-01-22T07:49:42Z',
    '2020-01-22T07:49:57Z',
  ],
}
