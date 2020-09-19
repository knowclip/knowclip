import {
  startApp,
  stopApp,
  TestSetup,
  TMP_DIRECTORY,
  ASSETS_DIRECTORY,
  GENERATED_ASSETS_DIRECTORY,
} from '../../setUpDriver'
import makeCardsFromSubtitles from './makeCardsFromSubtitles'
import saveAndCloseProject from './saveAndCloseProject'
import { join } from 'path'
import { mockSideEffects } from '../../../utils/sideEffects'
import { TestDriver } from '../../driver/TestDriver'

jest.setTimeout(60000)

const testId = 'subtitlesProject'

describe('make clips and cards from subtitles', () => {
  let context: { app: TestDriver | null; testId: string } = {
    app: null,
    testId,
  }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context, persistedState)

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
  nowUtcTimestamp: [
    '2020-01-24T23:44:33Z',
    '2020-01-24T23:44:38Z',
    '2020-02-02T15:29:14Z',
    '2020-02-02T15:29:14Z',
    '2020-02-02T15:29:15Z',
    '2020-02-02T15:29:15Z',
    '2020-02-02T15:29:15Z',
    '2020-02-02T15:29:17Z',
    '2020-02-02T15:29:17Z',
    '2020-02-02T15:29:19Z',
    '2020-02-02T15:29:19Z',
    '2020-02-02T15:29:19Z',
    '2020-02-02T15:29:19Z',
    '2020-02-02T15:29:19Z',
    '2020-02-02T15:29:19Z',
  ],
}

const persistedState: Partial<AppState> = {
  fileAvailabilities: {
    ProjectFile: {
      'ef3a2602-37a0-4158-89d6-47b75edb5bea': {
        type: 'ProjectFile',
        id: 'ef3a2602-37a0-4158-89d6-47b75edb5bea',
        parentId: null,
        name: 'Project with subtitles',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(TMP_DIRECTORY, '/project_with_subtitles.kyml'),
        lastOpened: '2020-02-01T16:11:16Z',
      },
    },
    MediaFile: {
      'bd8aca85-de21-4666-bbab-a33fd21d03f1': {
        type: 'MediaFile',
        id: 'bd8aca85-de21-4666-bbab-a33fd21d03f1',
        parentId: 'ef3a2602-37a0-4158-89d6-47b75edb5bea',
        name: 'polar_bear_cafe.mp4',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(ASSETS_DIRECTORY, '/polar_bear_cafe.mp4'),
        lastOpened: '2020-02-01T16:11:18Z',
      },
      'f5053503-8e5f-45c3-9afc-26f5e6eab8a8': {
        type: 'MediaFile',
        id: 'f5053503-8e5f-45c3-9afc-26f5e6eab8a8',
        parentId: 'ef3a2602-37a0-4158-89d6-47b75edb5bea',
        name: 'piggeldy_cat.mp4',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(ASSETS_DIRECTORY, '/piggeldy_cat.mp4'),
        lastOpened: '2020-02-01T16:11:17Z',
      },
    },
    ExternalSubtitlesFile: {
      'a8b64692-dba0-4ef4-b5e7-8c887956a69a': {
        type: 'ExternalSubtitlesFile',
        id: 'a8b64692-dba0-4ef4-b5e7-8c887956a69a',
        parentId: 'bd8aca85-de21-4666-bbab-a33fd21d03f1',
        name: 'pbc_jp.ass',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(ASSETS_DIRECTORY, '/pbc_jp.ass'),
        lastOpened: '2020-02-01T16:11:18Z',
      },
    },
    VttConvertedSubtitlesFile: {
      '5f581055-dbf5-4f3b-bcee-a3215e405ffc': {
        type: 'VttConvertedSubtitlesFile',
        id: '5f581055-dbf5-4f3b-bcee-a3215e405ffc',
        parentId: 'bd8aca85-de21-4666-bbab-a33fd21d03f1',
        name: 'VttConvertedSubtitlesFile',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe.mp4_2_5f581055-dbf5-4f3b-bcee-a3215e405ffc.vtt'
        ),
        lastOpened: '2020-02-01T16:11:27Z',
      },
      'a8b64692-dba0-4ef4-b5e7-8c887956a69a': {
        type: 'VttConvertedSubtitlesFile',
        id: 'a8b64692-dba0-4ef4-b5e7-8c887956a69a',
        parentId: 'a8b64692-dba0-4ef4-b5e7-8c887956a69a',
        name: 'VttConvertedSubtitlesFile',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/pbc_jp.ass_a8b64692-dba0-4ef4-b5e7-8c887956a69a.vtt'
        ),
        lastOpened: '2020-02-01T16:11:24Z',
      },
    },
    WaveformPng: {
      'bd8aca85-de21-4666-bbab-a33fd21d03f1': {
        type: 'WaveformPng',
        id: 'bd8aca85-de21-4666-bbab-a33fd21d03f1',
        parentId: 'bd8aca85-de21-4666-bbab-a33fd21d03f1',
        name: 'WaveformPng',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe.mp4_bd8aca85-de21-4666-bbab-a33fd21d03f1.png'
        ),
        lastOpened: '2020-02-01T16:11:19Z',
      },
      'f5053503-8e5f-45c3-9afc-26f5e6eab8a8': {
        type: 'WaveformPng',
        id: 'f5053503-8e5f-45c3-9afc-26f5e6eab8a8',
        parentId: 'f5053503-8e5f-45c3-9afc-26f5e6eab8a8',
        name: 'WaveformPng',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/piggeldy_cat.mp4_f5053503-8e5f-45c3-9afc-26f5e6eab8a8.png'
        ),
        lastOpened: '2020-02-01T16:11:17Z',
      },
    },
    ConstantBitrateMp3: {},
    VideoStillImage: {
      '6b02575a-0a4f-402a-8ea3-31f457cb5d8c': {
        type: 'VideoStillImage',
        id: '6b02575a-0a4f-402a-8ea3-31f457cb5d8c',
        parentId: null,
        name: 'VideoStillImage',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe_10-280_6b02575a-0a4f-402a-8ea3-31f457cb5d8c.png'
        ),
        lastOpened: '2020-02-01T16:10:42Z',
      },
      'ff54865f-ef52-4f16-9f20-2ae257eceb40': {
        type: 'VideoStillImage',
        id: 'ff54865f-ef52-4f16-9f20-2ae257eceb40',
        parentId: null,
        name: 'VideoStillImage',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe_16-760_ff54865f-ef52-4f16-9f20-2ae257eceb40.png'
        ),
        lastOpened: '2020-02-01T16:10:44Z',
      },
      'a3a0c3eb-3841-4d2f-851a-5af95cd14855': {
        type: 'VideoStillImage',
        id: 'a3a0c3eb-3841-4d2f-851a-5af95cd14855',
        parentId: null,
        name: 'VideoStillImage',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe_78-180_a3a0c3eb-3841-4d2f-851a-5af95cd14855.png'
        ),
        lastOpened: '2020-02-01T16:10:54Z',
      },
      '152077c6-336b-47d6-88e6-1ba4410db553': {
        type: 'VideoStillImage',
        id: '152077c6-336b-47d6-88e6-1ba4410db553',
        parentId: null,
        name: 'VideoStillImage',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/piggeldy_cat_7-900_152077c6-336b-47d6-88e6-1ba4410db553.png'
        ),
        lastOpened: '2020-02-01T16:11:17Z',
      },
      '864d822f-d482-438e-9620-684b2730a688': {
        type: 'VideoStillImage',
        id: '864d822f-d482-438e-9620-684b2730a688',
        parentId: null,
        name: 'VideoStillImage',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/piggeldy_cat_19-220_864d822f-d482-438e-9620-684b2730a688.png'
        ),
        lastOpened: '2020-02-01T16:11:17Z',
      },
      'c9723266-41d2-4676-884f-a811ec89c786': {
        type: 'VideoStillImage',
        id: 'c9723266-41d2-4676-884f-a811ec89c786',
        parentId: null,
        name: 'VideoStillImage',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/piggeldy_cat_43-020_c9723266-41d2-4676-884f-a811ec89c786.png'
        ),
        lastOpened: '2020-02-01T16:11:18Z',
      },
    },
  },
}
