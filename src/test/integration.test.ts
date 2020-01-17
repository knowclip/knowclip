import { Application, SpectronClient } from 'spectron'
import { join } from 'path'
import { testLabels as projectsMenu } from '../components/ProjectsMenu'
import { testLabels as newProjectForm } from '../components/Dialog/NewProjectFormDialog'
import { testLabels as main } from '../components/Main'
import { testLabels as mediaFilesMenu } from '../components/MediaFilesNavMenu'
import { testLabels as flashcardSection } from '../components/FlashcardSection'
import { testLabels as tagsInput } from '../components/TagsInput'
import { testLabels as projectMenu } from '../components/ProjectMenu'
import {
  setUpApp,
  tearDownApp,
  mockElectronHelpers,
  _,
  TestSetup,
} from './setup'
import { RawResult, Element } from 'webdriverio'
import { mkdirp, remove, existsSync } from 'fs-extra'
// import { remove, copy } from 'fs-extra'

jest.setTimeout(120000)

const MEDIA_DIRECTORY = join(__dirname, 'media')

describe('App', () => {
  let context: { app: Application | null } = { app: null }

  beforeAll(async () => {
    const tmpDirectory = join(process.cwd(), 'test-tmp')
    if (existsSync(tmpDirectory)) await remove(tmpDirectory)
    await mkdirp(tmpDirectory)
    // await copy(join(__dirname, 'fixtures'), tmpDirectory)
  })

  it('creates a deck from a new project', async () => {
    const setup = await setUpApp(context)
    const pad = (text: string) => '***' + text.padStart(250, ' ')
    async function step(description: string, action: () => Promise<void>) {
      console.log(pad(description))

      try {
        await action()
        console.log(pad('SUCCESS!'))
      } catch (err) {
        console.log(pad('FAILURE :('))
        throw err
      }
    }

    await step('create a new project', async () => {
      await createNewProject(setup)
    })
    await step('change project name', async () => {
      await changeProjectName(setup)
    })
    await step('add media to project', async () => {
      await addJapaneseMedia(setup)
    })
    await step('create flashcards', async () => {
      await makeTwoFlashcards(setup)
    })

    await tearDownApp(context)
  })
})

async function changeProjectName({ $, client, app }: TestSetup) {
  expect(await $(projectMenu.projectTitle).getText()).toContain(
    'My cool poject'
  )
  await $(projectMenu.projectTitle).doubleClick()
  await $(projectMenu.projectTitleInput).doubleClick()
  await $(projectMenu.projectTitleInput).keys([
    ...[...Array(10)].map(() => 'Backspace'),
    ...'My cool project',
  ])
  await $(projectMenu.projectTitleInput).submitForm()
  await client.waitForExist(_(projectMenu.projectTitle))
  expect(await $(projectMenu.projectTitle).getText()).toContain(
    'My cool project'
  )
}

async function makeTwoFlashcards({ app, $, $$, client }: TestSetup) {
  const mouseDragEvents = getMouseDragEvents([402, 422], [625, 422])
  await runEvents(app, mouseDragEvents)
  await client.waitForExist(_(flashcardSection.flashcardField))
  await fillInFlashcardFields(
    await $$(flashcardSection.flashcardField),
    client,
    {
      transcription: '笹を食べながらのんびりするのは最高だなぁ',
      pronunciation: 'sasa-o tabe-nágara nonbíri-suru-no-wa saikoo-da-naa',
      meaning: 'Lying around while eating bamboo grass is the best',
    }
  )
  await $(tagsInput.tagsInput)
    .$('svg')
    .click()
  await $(tagsInput.tagsInput).click()
  await $(tagsInput.tagsInput)
    .$('input')
    .setValue('pbc')
  await $(tagsInput.tagsInput)
    .$('input')
    .keys(['Enter'])
  await runEvents(app, getMouseDragEvents([756, 422], [920, 422]))
  expect(await app.client.$$(`.${tagsInput.tagsInput} svg`)).toHaveLength(1)
  expect(await $(tagsInput.tagsInput).getText()).toContain('pbc')
  await fillInFlashcardFields(
    await $$(flashcardSection.flashcardField),
    client,
    {
      transcription: 'またこの子は昼間からゴロゴロして',
      pronunciation: 'mata kono ko-wa hiruma-kara goro-goro shite',
      meaning: 'This kid, lazing about again so early',
      notes: '"Goro-goro" is the sound of something big rolling around.',
    }
  )
}

async function fillInFlashcardFields(
  elements: RawResult<Element>[],
  client: SpectronClient,
  {
    transcription,
    pronunciation,
    meaning,
    notes,
  }: Partial<TransliterationFlashcardFields>
) {
  const [transcriptionId, pronunciationId, meaningId, notesId] = elements.map(
    el => el.value.ELEMENT
  )
  if (transcription) await client.elementIdValue(transcriptionId, transcription)
  if (pronunciation) await client.elementIdValue(pronunciationId, pronunciation)
  if (meaning) await client.elementIdValue(meaningId, meaning)
  if (notes) await client.elementIdValue(notesId, notes)
}

async function runEvents(app: Application, [next, ...rest]: any[]) {
  if (next) {
    await app.webContents.sendInputEvent(next)
    await runEvents(app, rest)
  }
}
function getMouseDragEvents(
  [fromX, fromY]: [number, number],
  [toX, toY]: [number, number]
) {
  return [
    {
      type: 'mouseDown',
      x: fromX,
      y: fromY,
    },
    {
      type: 'mouseMove',
      x: ~~((toX + fromX) / 2),
      y: ~~((toY + fromY) / 2),
    },
    {
      type: 'mouseMove',
      x: toX,
      y: toY,
    },
    {
      type: 'mouseUp',
      x: toX,
      y: toY,
    },
  ]
}

async function addJapaneseMedia(setup: TestSetup) {
  const { app, client, $ } = setup
  const { mediaFilesNavMenuButton } = main
  const japaneseVideoPath = join(MEDIA_DIRECTORY, 'japanese.mp4')
  await mockElectronHelpers(app, {
    showOpenDialog: Promise.resolve([japaneseVideoPath]),
  })
  await $(mediaFilesNavMenuButton).click()
  await client.waitUntilTextExists('body', 'japanese.mp4')
  const video = $('audioPlayer')
  expect(await video.getAttribute('src')).toContain(japaneseVideoPath)
}

async function createNewProject({ app, client, $ }: TestSetup) {
  $(projectsMenu.newProjectButton).click()

  await mockElectronHelpers(app, {
    showSaveDialog: Promise.resolve(
      join(process.cwd(), 'test-tmp', 'my_cool_project.afca')
    ),
  })
  const {
    projectNameField,
    projectFileLocationField,
    noteTypeSelect,
    transcriptionNoteTypeOption,
    saveButton,
    cardsPreview,
  } = newProjectForm

  await client.waitForExist(_(projectNameField))
  await $(projectNameField).setValue('My cool poject')

  $(projectFileLocationField).click()

  $(noteTypeSelect).click()
  await client.waitForExist(_(transcriptionNoteTypeOption))
  await $(transcriptionNoteTypeOption).click()

  await client.waitForExist(_(cardsPreview))

  await app.client.waitUntil(
    async () =>
      !(await app.client.isExisting(
        _(newProjectForm.transcriptionNoteTypeOption)
      ))
  )

  await $(saveButton).click()

  await client.waitForExist(_(main.mediaFilesNavMenuButton))
}
