import {
  startApp,
  stopApp,
  TestSetup,
  TMP_DIRECTORY,
  ASSETS_DIRECTORY,
  GENERATED_ASSETS_DIRECTORY,
} from '../../setUpDriver'
import { mockSideEffects } from '../../../utils/sideEffects'
import { join } from 'path'
import { runAll } from '../step'
import { savedProjectTestSteps } from './savedProjectTestSteps'
import { parseProjectJson } from '../../../utils/parseProject'
import { TestDriver } from '../../driver/TestDriver'

jest.setTimeout(60000)

const testId = 'savedProject'

describe('opening and saving a previously saved project', () => {
  let context: { app: TestDriver | null; testId: string } = {
    app: null,
    testId,
  }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context, persistedState)

    await mockSideEffects(setup.app, sideEffectsMocks)
  })

  runAll(
    savedProjectTestSteps({
      projectTitle: 'My cool saved project',
    }),
    () => setup
  )

  test('resulting project file matches snapshot', async () => {
    const actualProjectFileContents = await parseProjectJson(
      join(TMP_DIRECTORY, 'my_previously_saved_project.kyml')
    )

    expect(actualProjectFileContents).toMatchSnapshot()
  })

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
  nowUtcTimestamp: [
    '2020-01-27T22:28:12Z',
    '2020-01-27T22:28:22Z',
    '2020-02-02T15:31:34Z',
    '2020-02-02T15:31:35Z',
    '2020-02-02T15:31:35Z',
    '2020-02-02T15:31:35Z',
    '2020-02-02T15:31:35Z',
    '2020-02-02T15:31:36Z',
    '2020-02-02T15:31:37Z',
    '2020-02-02T15:31:37Z',
    '2020-02-02T15:31:40Z',
    '2020-02-02T15:31:42Z',
    '2020-02-02T15:31:43Z',
    '2020-02-02T15:31:43Z',
    '2020-02-02T15:31:43Z',
    '2020-02-02T15:31:43Z',
    '2020-02-02T15:31:43Z',
    '2020-02-02T15:31:43Z',
    '2020-02-02T15:31:43Z',
    '2020-02-02T15:31:43Z',
    '2020-02-02T15:31:44Z',
    '2020-03-20T13:27:57Z',
    '2020-03-20T13:27:58Z',
  ],
}
const persistedState: Partial<AppState> = {
  fileAvailabilities: {
    ProjectFile: {
      '91bfd159-155c-4b61-bdd5-d71e2e944773': {
        type: 'ProjectFile',
        id: '91bfd159-155c-4b61-bdd5-d71e2e944773',
        parentId: null,
        name: 'My cool saved project',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(TMP_DIRECTORY, '/my_previously_saved_project.kyml'),
        lastOpened: '2020-02-01T13:20:55Z',
      },
    },
    MediaFile: {
      '10fd95ee-ba1a-424f-95fb-66a28c91faf1': {
        type: 'MediaFile',
        id: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        parentId: '91bfd159-155c-4b61-bdd5-d71e2e944773',
        name: 'polar_bear_cafe.mp4',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(ASSETS_DIRECTORY, '/polar_bear_cafe.mp4'),
        lastOpened: '2020-02-01T13:21:20Z',
      },
      'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77': {
        type: 'MediaFile',
        id: 'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
        parentId: '91bfd159-155c-4b61-bdd5-d71e2e944773',
        name: 'piggeldy_cat.mp4',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(ASSETS_DIRECTORY, '/piggeldy_cat.mp4'),
        lastOpened: '2020-02-01T13:21:08Z',
      },
    },
    ExternalSubtitlesFile: {
      'b3347257-97c4-4c9a-8eae-9bf88a8edc23': {
        type: 'ExternalSubtitlesFile',
        id: 'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
        parentId: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        name: 'pbc_jp.ass',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(ASSETS_DIRECTORY, '/pbc_jp.ass'),
        lastOpened: '2020-02-01T13:21:20Z',
      },
    },
    VttConvertedSubtitlesFile: {
      'd680807d-3a5f-4a25-967f-71871b7d5057': {
        type: 'VttConvertedSubtitlesFile',
        id: 'd680807d-3a5f-4a25-967f-71871b7d5057',
        parentId: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        name: 'VttConvertedSubtitlesFile',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe.mp4_2_d680807d-3a5f-4a25-967f-71871b7d5057.vtt'
        ),
        lastOpened: '2020-02-01T13:21:21Z',
      },
      'b3347257-97c4-4c9a-8eae-9bf88a8edc23': {
        type: 'VttConvertedSubtitlesFile',
        id: 'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
        parentId: 'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
        name: 'VttConvertedSubtitlesFile',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/pbc_jp.ass_b3347257-97c4-4c9a-8eae-9bf88a8edc23.vtt'
        ),
        lastOpened: '2020-02-01T13:21:21Z',
      },
    },
    WaveformPng: {
      '10fd95ee-ba1a-424f-95fb-66a28c91faf1': {
        type: 'WaveformPng',
        id: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        parentId: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        name: 'WaveformPng',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe.mp4_10fd95ee-ba1a-424f-95fb-66a28c91faf1.png'
        ),
        lastOpened: '2020-02-01T13:21:21Z',
      },
      'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77': {
        type: 'WaveformPng',
        id: 'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
        parentId: 'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
        name: 'WaveformPng',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/piggeldy_cat.mp4_bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77.png'
        ),
        lastOpened: '2020-02-01T13:21:19Z',
      },
    },
    ConstantBitrateMp3: {},
    VideoStillImage: {
      '632a6cff-7fd7-4d0f-b657-0b9636204261': {
        type: 'VideoStillImage',
        id: '632a6cff-7fd7-4d0f-b657-0b9636204261',
        parentId: null,
        name: 'VideoStillImage',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe_10-280_632a6cff-7fd7-4d0f-b657-0b9636204261.png'
        ),
        lastOpened: '2020-02-01T13:20:59Z',
      },
      'a272b282-4d89-4af0-9d17-baa807793f1f': {
        type: 'VideoStillImage',
        id: 'a272b282-4d89-4af0-9d17-baa807793f1f',
        parentId: null,
        name: 'VideoStillImage',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe_16-760_a272b282-4d89-4af0-9d17-baa807793f1f.png'
        ),
        lastOpened: '2020-02-01T13:21:00Z',
      },
      '6fce08e8-9312-4930-9601-c14b470e57ab': {
        type: 'VideoStillImage',
        id: '6fce08e8-9312-4930-9601-c14b470e57ab',
        parentId: null,
        name: 'VideoStillImage',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe_78-180_6fce08e8-9312-4930-9601-c14b470e57ab.png'
        ),
        lastOpened: '2020-02-01T13:21:08Z',
      },
    },
  },
}
