import { Application } from 'spectron'
import {
  startApp,
  stopApp,
  mockElectronHelpers,
  TestSetup,
  TMP_DIRECTORY,
} from '../../setup'
import { mkdirp, remove, existsSync } from 'fs-extra'
import createNewProject from './createNewProject'
import changeProjectName from './changeProjectName'
import addFirstMediaToProject from './addFirstMediaToProject'
import makeTwoFlashcards from './makeTwoFlashcards'
import navigateBetweenClips from './navigateBetweenClips'
import addMoreMediaToProject from './addMoreMediaToProject'
import navigateBetweenMedia from './navigateBetweenMedia'
import exportApkg from './exportApkg'
// import { remove, copy } from 'fs-extra'

jest.setTimeout(60000)

// describe('create a deck from a previously opened project', () => {
// describe('create a deck from a shared project', () => {
describe('create a deck from a new project', () => {
  let context: { app: Application | null } = { app: null }
  let setup: TestSetup

  beforeAll(async () => {
    if (existsSync(TMP_DIRECTORY)) await remove(TMP_DIRECTORY)
    await mkdirp(TMP_DIRECTORY)
    // await copy(join(__dirname, 'fixtures'), TMP_DIRECTORY)
    setup = await startApp(context)
  })

  test('create a new project', async () => {
    return createNewProject(setup)
  })
  test('change project name', async () => changeProjectName(setup))
  test('add media to project', async () => addFirstMediaToProject(setup))
  test('create clips + flashcards', async () => makeTwoFlashcards(setup))
  // navigate to end of video and add one more flashcard
  test('navigate between clips', async () => navigateBetweenClips(setup))
  test('add more media to project', async () => addMoreMediaToProject(setup))
  test('navigate between media', async () => navigateBetweenMedia(setup))
  // test('create clips + flashcards', async () => makeTwoFlashcards(setup))
  // test('create flashcards from subtitles', async () => creatFlashcardsFromSubtitles(setup))
  test('exporting an .apkg', async () => exportApkg(setup))

  afterAll(async () => {
    await mockElectronHelpers(setup.app, {
      showMessageBox: Promise.resolve({
        response: 0,
        checkboxChecked: false,
      }),
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
