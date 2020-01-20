import { Application } from 'spectron'
import {
  startApp,
  stopApp,
  TestSetup,
  TMP_DIRECTORY,
  FIXTURES_DIRECTORY,
} from '../../setup'
import { mkdirp, remove, existsSync, copy } from 'fs-extra'
import createNewProject from './createNewProject'
import changeProjectName from './changeProjectName'
import addFirstMediaToProject from './addFirstMediaToProject'
import makeSomeFlashcards from './makeSomeFlashcards'
import navigateBetweenClips from './navigateBetweenClips'
import addMoreMediaToProject from './addMoreMediaToProject'
import navigateBetweenMedia from './navigateBetweenMedia'
import exportApkg from './exportApkg'
import moveThroughoutMedia from './moveThroughoutMedia'
import saveProject from './saveProject'
import { mockSideEffects } from '../../../utils/sideEffects'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

jest.setTimeout(60000)

// describe('create a deck from a previously opened project', () => {
// describe('create a deck from a shared project', () => {
describe('create a deck from a new project', () => {
  let context: { app: Application | null } = { app: null }
  let setup: TestSetup

  beforeAll(async () => {
    if (existsSync(TMP_DIRECTORY)) await remove(TMP_DIRECTORY)
    await mkdirp(TMP_DIRECTORY)
    await copy(FIXTURES_DIRECTORY, TMP_DIRECTORY)
    setup = await startApp(context, 'newProjectTest')

    await mockSideEffects(setup.app, {
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
        '2020-01-20T11:42:45Z',
        '2020-01-20T11:42:45Z',
        '2020-01-20T11:42:45Z',
        '2020-01-20T11:43:24Z',
        '2020-01-20T11:43:27Z',
      ],
    })
  })

  test('create a new project', async () => {
    return createNewProject(setup)
  }) // should create file
  test('change project name', async () => changeProjectName(setup))
  test('add media to project', async () => addFirstMediaToProject(setup))
  test('create clips + flashcards', async () => makeSomeFlashcards(setup))
  // navigate to end of video and add one more flashcard
  test('navigate between clips', async () => navigateBetweenClips(setup))
  test('move throughout media file', async () => moveThroughoutMedia(setup))
  test('add more media to project', async () => addMoreMediaToProject(setup))
  // stretch clips
  test('navigate between media', async () => navigateBetweenMedia(setup))
  // test('create clips + flashcards', async () => makeTwoFlashcards(setup))
  // test('create flashcards from subtitles', async () => creatFlashcardsFromSubtitles(setup))
  test('exporting an .apkg', async () => exportApkg(setup))
  test('saving a project file', async () => saveProject(setup))
  // test project file matches example
  // and stuff was saved to local storage?

  afterAll(async () => {
    await mockElectronHelpers(setup.app, {
      showMessageBox: [
        Promise.resolve({
          response: 0,
          checkboxChecked: false,
        }),
      ],
    })
    await stopApp(context)
  })
})

// describe('second test', () => {
//   let context: { app: Application | null } = { app: null }
//   let setup: TestSetup

//   beforeAll(async () => {
//     if (existsSync(TMP_DIRECTORY)) await remove(TMP_DIRECTORY)
//     await mkdirp(TMP_DIRECTORY)
//     // await copy(join(__dirname, 'fixtures'), TMP_DIRECTORY)
//     setup = await startApp(context)
//   })

//   test('create a new project', async () => {
// return (setup))
//   test('change project name', async () => changeProjectName(setup))
//   test('add media to project', async () => addJapaneseMedia(setup))
//   test('create flashcards', async () => makeTwoFlashcards(setup))

//   afterAll(async () => {
//     await mockElectronHelpers(setup.app, {
//       showMessageBox: Promise.resolve({
//         response: 0,
//         checkboxChecked: false,
//       }),
//     })
//     await stopApp(context)
//   })
// })
