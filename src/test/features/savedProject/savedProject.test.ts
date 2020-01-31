import { Application } from 'spectron'
import {
  startApp,
  stopApp,
  TestSetup,
  TMP_DIRECTORY,
  ASSETS_DIRECTORY,
  GENERATED_ASSETS_DIRECTORY,
} from '../../spectronApp'
import { mockSideEffects } from '../../../utils/sideEffects'
import openSavedProject from './openSavedProject'
import { join } from 'path'
import makeSomeFlashcards from './makeSomeFlashcards'
import saveAndCloseProject from './saveAndCloseProject'
import linkSubtitlesToFields from './linkSubtitlesToFields'

jest.setTimeout(60000)

const testId = 'savedProject'

describe('opening and saving a previously saved project', () => {
  let context: { app: Application | null } = { app: null }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context, testId, persistedState)

    await mockSideEffects(setup.app, sideEffectsMocks)
  })

  test('opens a previously saved project', () => openSavedProject(setup))
  test('make some flashcards', () => makeSomeFlashcards(setup))
  test('link subtitles to fields', () => linkSubtitlesToFields(setup))
  test('save and closes project', () => saveAndCloseProject(setup))

  afterAll(async () => {
    await stopApp(context)
  })
})

const sideEffectsMocks = {
  uuid: [
    '136042f2-00bc-4d9b-a3a7-3da1b7868c78',
    '1e62d23d-3f3b-4785-b8ba-5d61dddc78ed',
    '9a07597c-7885-49bc-97d4-76a2dffdb9aa',
  ],
  nowUtcTimestamp: ['2020-01-27T22:28:12Z', '2020-01-27T22:28:22Z'],
}

const persistedState: Partial<AppState> = {
  files: {
    ProjectFile: {
      '6153116d-faf3-4b70-864b-80475f2e3091': {
        type: 'ProjectFile',
        id: '6153116d-faf3-4b70-864b-80475f2e3091',
        name: 'My cool saved project',
        noteType: 'Transliteration',
        mediaFileIds: [
          '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
          '918d2b17-578f-4c5e-aafa-08d736e52af1',
        ],
        error: null,
        lastSaved: '2020-01-28T12:29:32Z',
      },
    },
    MediaFile: {
      '6b12235d-ad09-4af7-b7f2-88e19357cb9d': {
        id: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
        type: 'MediaFile',
        parentId: '6153116d-faf3-4b70-864b-80475f2e3091',
        subtitles: [
          {
            type: 'EmbeddedSubtitlesTrack',
            id: '31dfe711-758e-4ba4-9dff-0fb73d1ab79a',
            streamIndex: 2,
          },
          {
            type: 'ExternalSubtitlesTrack',
            id: '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271',
          },
        ],
        flashcardFieldsToSubtitlesTracks: {},
        isVideo: true,
        name: 'polar_bear_cafe.mp4',
        durationSeconds: 87.062,
        format: 'mov,mp4,m4a,3gp,3g2,mj2',
        subtitlesTracksStreamIndexes: [2],
        width: 1920,
        height: 1080,
      },
      '918d2b17-578f-4c5e-aafa-08d736e52af1': {
        id: '918d2b17-578f-4c5e-aafa-08d736e52af1',
        type: 'MediaFile',
        parentId: '6153116d-faf3-4b70-864b-80475f2e3091',
        subtitles: [],
        flashcardFieldsToSubtitlesTracks: {},
        isVideo: true,
        name: 'piggeldy_cat.mp4',
        durationSeconds: 58.24,
        format: 'mov,mp4,m4a,3gp,3g2,mj2',
        subtitlesTracksStreamIndexes: [],
        width: 480,
        height: 360,
      },
    },
    ExternalSubtitlesFile: {
      '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271': {
        type: 'ExternalSubtitlesFile',
        parentId: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
        id: '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271',
        name: 'pbc_jp.ass',
      },
    },
    VttConvertedSubtitlesFile: {
      '31dfe711-758e-4ba4-9dff-0fb73d1ab79a': {
        type: 'VttConvertedSubtitlesFile',
        parentId: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
        id: '31dfe711-758e-4ba4-9dff-0fb73d1ab79a',
        streamIndex: 2,
        parentType: 'MediaFile',
      },
      '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271': {
        type: 'VttConvertedSubtitlesFile',
        id: '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271',
        parentId: '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271',
        parentType: 'ExternalSubtitlesFile',
      },
    },
    WaveformPng: {
      '6b12235d-ad09-4af7-b7f2-88e19357cb9d': {
        type: 'WaveformPng',
        parentId: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
        id: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
      },
      '918d2b17-578f-4c5e-aafa-08d736e52af1': {
        type: 'WaveformPng',
        parentId: '918d2b17-578f-4c5e-aafa-08d736e52af1',
        id: '918d2b17-578f-4c5e-aafa-08d736e52af1',
      },
    },
    ConstantBitrateMp3: {},
    VideoStillImage: {
      'c3637ef9-ea4d-4049-b604-a768239f721c': {
        type: 'VideoStillImage',
        id: 'c3637ef9-ea4d-4049-b604-a768239f721c',
        mediaFileId: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
      },
      '2a4c9389-8d9f-4b50-8b33-5dd62aa7aa4d': {
        type: 'VideoStillImage',
        id: '2a4c9389-8d9f-4b50-8b33-5dd62aa7aa4d',
        mediaFileId: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
      },
    },
  },
  fileAvailabilities: {
    ProjectFile: {
      '6153116d-faf3-4b70-864b-80475f2e3091': {
        filePath: join(TMP_DIRECTORY, 'my_previously_saved_project.afca'),
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
        id: '6153116d-faf3-4b70-864b-80475f2e3091',
      },
    },
    MediaFile: {
      '6b12235d-ad09-4af7-b7f2-88e19357cb9d': {
        filePath: join(ASSETS_DIRECTORY, 'polar_bear_cafe.mp4'),
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',

        id: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
      },
      '918d2b17-578f-4c5e-aafa-08d736e52af1': {
        filePath: join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4'),
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',

        id: '918d2b17-578f-4c5e-aafa-08d736e52af1',
      },
    },
    ExternalSubtitlesFile: {
      '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271': {
        filePath: join(ASSETS_DIRECTORY, 'pbc_jp.ass'),
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',

        id: '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271',
      },
    },
    VttConvertedSubtitlesFile: {
      '31dfe711-758e-4ba4-9dff-0fb73d1ab79a': {
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',

        id: '31dfe711-758e-4ba4-9dff-0fb73d1ab79a',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          'd9ca9f57367767ad9ebbdc366558738f.vtt'
        ),
      },
      '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271': {
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',

        id: '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '9700310870f37b1824fa5f35ace353f7.vtt'
        ),
      },
    },
    WaveformPng: {
      '6b12235d-ad09-4af7-b7f2-88e19357cb9d': {
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',

        id: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '40371c4096cf908ffab747bcbcce95d3.png'
        ),
      },
      '918d2b17-578f-4c5e-aafa-08d736e52af1': {
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',

        id: '918d2b17-578f-4c5e-aafa-08d736e52af1',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '34cd4f92fbad0aa454b5252b48f5911c.png'
        ),
      },
    },
    ConstantBitrateMp3: {},
    VideoStillImage: {
      'c3637ef9-ea4d-4049-b604-a768239f721c': {
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',

        id: 'c3637ef9-ea4d-4049-b604-a768239f721c',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          'db830c671edb3c27cb3198a95663b6b2.png'
        ),
      },
      '2a4c9389-8d9f-4b50-8b33-5dd62aa7aa4d': {
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',

        id: '2a4c9389-8d9f-4b50-8b33-5dd62aa7aa4d',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          'c066939580d80abdf4e76f1473e283ba.png'
        ),
      },
    },
  },
}
