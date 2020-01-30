import { Application } from 'spectron'
import {
  startApp,
  stopApp,
  TestSetup,
  TMP_DIRECTORY,
  ASSETS_DIRECTORY,
  GENERATED_ASSETS_DIRECTORY,
} from '../../spectronApp'
import makeCardsFromSubtitles from './makeCardsFromSubtitles'
import saveAndCloseProject from './saveAndCloseProject'
import { join } from 'path'
import { mockSideEffects } from '../../../utils/sideEffects'

jest.setTimeout(60000)

const testId = 'subtitlesProject'

describe('make clips and cards from subtitles', () => {
  let context: { app: Application | null } = { app: null }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context, testId, persistedState)

    await mockSideEffects(setup.app, sideEffectsMocks)
  })

  test('automatically make clips and cards from subtitles', () =>
    makeCardsFromSubtitles(setup))
  test('saves and closes project', () => saveAndCloseProject(setup))

  afterAll(async () => {
    await stopApp(context)
  })
})

const sideEffectsMocks = {
  uuid: [
    '94367f0c-92ef-4542-a80a-6fbaf8e1ad76',
    'e78620d8-9ebd-45b8-b335-d3280a4f3ecc',
    '320265ad-8190-4729-8ec1-5fcf0d1b832e',
    '2f5ad340-c06b-4754-a468-56852ec9638c',
    '7d4e2afe-55d1-4a1a-8365-767aa83c83e5',
    '8a0d55ba-e456-4108-9fe2-911d7d25ffde',
    '193c54f4-49f0-442b-b866-320ba111d369',
    'c7e5886a-0899-4192-8a9c-4b30c304a717',
    'f4f17e82-af87-459e-af11-4f3d65f9d5d7',
    'f1def124-bbaa-418a-8836-34a8d8cf74da',
    '6c34f168-1e1d-4933-84ae-df589c68ec06',
    '24374cd7-bed9-4f30-aace-dbdf8fe31422',
    '8f0f15ae-fe46-4b73-ad7d-36c4d10359dd',
    '2a3ce4c2-4714-47f6-9e33-2e28ba56eb1f',
    '90bf45fc-00e0-41b7-b82e-fda29473761e',
    'f85a53cc-4763-41a7-bfb2-ef615e2fc84d',
  ],
  nowUtcTimestamp: ['2020-01-24T23:44:33Z', '2020-01-24T23:44:38Z'],
}

const persistedState: Partial<AppState> = {
  files: {
    ProjectFile: {
      '6153116d-faf3-4b70-864b-80475f2e3091': {
        id: '6153116d-faf3-4b70-864b-80475f2e3091',
        type: 'ProjectFile',
        lastSaved: '2020-01-28T12:48:03Z',
        mediaFileIds: [
          '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
          '918d2b17-578f-4c5e-aafa-08d736e52af1',
        ],
        error: null,
        name: 'Project with subtitles',
        noteType: 'Transliteration',
        lastOpened: '2020-01-28T14:35:42Z',
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
        flashcardFieldsToSubtitlesTracks: {
          transcription: '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271',
          meaning: '31dfe711-758e-4ba4-9dff-0fb73d1ab79a',
        },
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
      '33255f9b-ae49-495b-8380-e6e8a7bb5835': {
        type: 'VideoStillImage',
        id: '33255f9b-ae49-495b-8380-e6e8a7bb5835',
        mediaFileId: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
      },
      '1e605009-4fc2-4ebc-9210-131244ed132c': {
        type: 'VideoStillImage',
        id: '1e605009-4fc2-4ebc-9210-131244ed132c',
        mediaFileId: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
      },
    },
  },
  fileAvailabilities: {
    ProjectFile: {
      '6153116d-faf3-4b70-864b-80475f2e3091': {
        filePath: join(TMP_DIRECTORY, `project_with_subtitles.afca`),
        status: 'CURRENTLY_LOADED',
        id: '6153116d-faf3-4b70-864b-80475f2e3091',
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
    },
    MediaFile: {
      '6b12235d-ad09-4af7-b7f2-88e19357cb9d': {
        id: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
        status: 'CURRENTLY_LOADED',
        filePath: join(ASSETS_DIRECTORY, 'polar_bear_cafe.mp4'),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
      '918d2b17-578f-4c5e-aafa-08d736e52af1': {
        id: '918d2b17-578f-4c5e-aafa-08d736e52af1',
        status: 'CURRENTLY_LOADED',
        filePath: join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4'),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
    },
    ExternalSubtitlesFile: {
      '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271': {
        id: '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271',
        status: 'CURRENTLY_LOADED',
        filePath: join(ASSETS_DIRECTORY, 'pbc_jp.ass'),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
    },
    VttConvertedSubtitlesFile: {
      '31dfe711-758e-4ba4-9dff-0fb73d1ab79a': {
        id: '31dfe711-758e-4ba4-9dff-0fb73d1ab79a',
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '7fac115654a45c5c9edced977a9e3625.vtt'
        ),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
      '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271': {
        id: '9e5c0e3f-6670-4dcd-86fd-2b4d90bfb271',
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '2cd6bd926e58ea6ca4ef48ab9bddc92e.vtt'
        ),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
    },
    WaveformPng: {
      '6b12235d-ad09-4af7-b7f2-88e19357cb9d': {
        id: '6b12235d-ad09-4af7-b7f2-88e19357cb9d',
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '41507e61e7c3cc5269b28ef1808f457e.png'
        ),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
      '918d2b17-578f-4c5e-aafa-08d736e52af1': {
        id: '918d2b17-578f-4c5e-aafa-08d736e52af1',
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          'd8dc1f60dd12bca9a24113c1915ece3c.png'
        ),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
    },
    ConstantBitrateMp3: {},
    VideoStillImage: {
      'c3637ef9-ea4d-4049-b604-a768239f721c': {
        id: 'c3637ef9-ea4d-4049-b604-a768239f721c',
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '076ed46d8d061d0b2ccd480e19307b60.png'
        ),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
      '33255f9b-ae49-495b-8380-e6e8a7bb5835': {
        id: '33255f9b-ae49-495b-8380-e6e8a7bb5835',
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          'db87aa3b164f54e7e29de678d4e33026.png'
        ),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
      '1e605009-4fc2-4ebc-9210-131244ed132c': {
        id: '1e605009-4fc2-4ebc-9210-131244ed132c',
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '3457599527bf61e30e3cad25c240baab.png'
        ),
        isLoading: false,
        lastOpened: '2020-01-28T14:35:42Z',
      },
    },
  },
}
