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
  test('navigate between clips', async () => navigateBetweenClips(setup))
  test('add more media to project', async () => addMoreMediaToProject(setup))
  // test('navigate between media', async () => navigateBetweenMedia(setup))
  // test('create clips + flashcards', async () => makeTwoFlashcards(setup))
  // test('create flashcards from subtitles', async () => creatFlashcardsFromSubtitles(setup))
  // test('exporting an .apkg', async () => exportApkg(setup))

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

// const getDeleteButton

// async function createNewProject({ app, client, $ }: TestSetup) {
//   $(projectsMenu.newProjectButton).click()

//   await mockElectronHelpers(app, {
//     showSaveDialog: Promise.resolve(
//       join(TMP_DIRECTORY, 'my_cool_project.afca')
//     ),
//   })
//   const {
//     projectNameField,
//     projectFileLocationField,
//     noteTypeSelect,
//     transcriptionNoteTypeOption,
//     saveButton,
//     cardsPreview,
//   } = newProjectForm

//   await client.waitForExist(_(projectNameField))
//   await $(projectNameField).setValue('My cool poject')

//   $(projectFileLocationField).click()

//   $(noteTypeSelect).click()
//   await client.waitForExist(_(transcriptionNoteTypeOption))
//   await $(transcriptionNoteTypeOption).click()

//   await client.waitForExist(_(cardsPreview))

//   await app.client.waitUntil(
//     async () =>
//       !(await app.client.isExisting(
//         _(newProjectForm.transcriptionNoteTypeOption)
//       ))
//   )

//   await $(saveButton).click()

//   await client.waitForExist(_(mediaFilesMenu.chooseFirstMediaFileButton))
// }

// async function changeProjectName({ $, client, app }: TestSetup) {
//   const { projectTitle, projectTitleInput } = projectMenu

//   expect(await $(projectTitle).getText()).toContain('My cool poject')
//   await $(projectTitle).doubleClick()
//   await $(projectTitleInput).doubleClick()
//   await $(projectTitleInput).keys([
//     ...[...Array(10)].map(() => 'Backspace'),
//     ...'My cool project',
//   ])
//   await $(projectTitleInput).submitForm()

//   await client.waitForExist(_(projectTitle))
//   expect(await $(projectTitle).getText()).toContain('My cool project')
// }

// async function addFirstMediaToProject(setup: TestSetup) {
//   const { app, client, $ } = setup
//   const { chooseFirstMediaFileButton: chooseMediaFileButton } = mediaFilesMenu
//   const japaneseVideoPath = join(MEDIA_DIRECTORY, 'polar_bear_cafe.mp4')
//   await mockElectronHelpers(app, {
//     showOpenDialog: Promise.resolve([japaneseVideoPath]),
//   })
//   await $(chooseMediaFileButton).click()
//   await client.waitUntilTextExists('body', 'polar_bear_cafe.mp4')
//   const video = client.$('video')
//   expect(await video.getAttribute('src')).toContain(japaneseVideoPath)
// }

// async function addMoreMediaToProject({ app, $, $$, client }: TestSetup) {
//   const { mediaFilesMenuButton, addNewAdditionalMediaButton } = mediaFilesMenu

//   await $(mediaFilesMenuButton).click()

//   const germanVideoPath = join(MEDIA_DIRECTORY, 'piggeldy_cat.mp4')

//   await mockElectronHelpers(app, {
//     showOpenDialog: Promise.resolve([germanVideoPath]),
//   })
//   await $(addNewAdditionalMediaButton).click()

//   const video = client.$('video')
//   expect(await video.getAttribute('src')).toContain(germanVideoPath)
// }
