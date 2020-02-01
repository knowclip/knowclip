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
import { join } from 'path'

import { readFile } from 'fs-extra'
import { runAll } from '../step'
import { savedProjectTestSteps } from './savedProjectTestSteps'

jest.setTimeout(60000)

const testId = 'savedProject'

describe('opening and saving a previously saved project', () => {
  let context: { app: Application | null; testId: string } = {
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
    const actualProjectFileContents = JSON.parse(
      await readFile(
        join(TMP_DIRECTORY, 'my_previously_saved_project.afca'),
        'utf8'
      )
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
  nowUtcTimestamp: ['2020-01-27T22:28:12Z', '2020-01-27T22:28:22Z'],
}

const persistedState: Partial<AppState> = {
  files: {
    ProjectFile: {
      '91bfd159-155c-4b61-bdd5-d71e2e944773': {
        id: '91bfd159-155c-4b61-bdd5-d71e2e944773',
        type: 'ProjectFile',
        lastSaved: '2020-02-01T13:20:55Z',
        name: 'My cool saved project',
        mediaFileIds: [
          '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
          'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
        ],
        error: null,
        noteType: 'Transliteration',
      },
    },
    MediaFile: {
      '10fd95ee-ba1a-424f-95fb-66a28c91faf1': {
        id: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        type: 'MediaFile',
        parentId: '91bfd159-155c-4b61-bdd5-d71e2e944773',
        subtitles: [
          {
            type: 'EmbeddedSubtitlesTrack',
            id: 'd680807d-3a5f-4a25-967f-71871b7d5057',
            streamIndex: 2,
          },
          {
            type: 'ExternalSubtitlesTrack',
            id: 'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
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
      'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77': {
        id: 'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
        type: 'MediaFile',
        parentId: '91bfd159-155c-4b61-bdd5-d71e2e944773',
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
      'b3347257-97c4-4c9a-8eae-9bf88a8edc23': {
        type: 'ExternalSubtitlesFile',
        parentId: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        id: 'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
        name: 'pbc_jp.ass',
      },
    },
    VttConvertedSubtitlesFile: {
      'd680807d-3a5f-4a25-967f-71871b7d5057': {
        type: 'VttConvertedSubtitlesFile',
        parentId: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        id: 'd680807d-3a5f-4a25-967f-71871b7d5057',
        streamIndex: 2,
        parentType: 'MediaFile',
      },
      'b3347257-97c4-4c9a-8eae-9bf88a8edc23': {
        type: 'VttConvertedSubtitlesFile',
        id: 'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
        parentId: 'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
        parentType: 'ExternalSubtitlesFile',
      },
    },
    WaveformPng: {
      '10fd95ee-ba1a-424f-95fb-66a28c91faf1': {
        type: 'WaveformPng',
        parentId: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        id: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
      },
      'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77': {
        type: 'WaveformPng',
        parentId: 'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
        id: 'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
      },
    },
    ConstantBitrateMp3: {},
    VideoStillImage: {
      '632a6cff-7fd7-4d0f-b657-0b9636204261': {
        id: '632a6cff-7fd7-4d0f-b657-0b9636204261',
        type: 'VideoStillImage',
        mediaFileId: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
      },
      'a272b282-4d89-4af0-9d17-baa807793f1f': {
        id: 'a272b282-4d89-4af0-9d17-baa807793f1f',
        type: 'VideoStillImage',
        mediaFileId: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
      },
      '6fce08e8-9312-4930-9601-c14b470e57ab': {
        id: '6fce08e8-9312-4930-9601-c14b470e57ab',
        type: 'VideoStillImage',
        mediaFileId: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
      },
    },
  },
  fileAvailabilities: {
    ProjectFile: {
      '91bfd159-155c-4b61-bdd5-d71e2e944773': {
        id: '91bfd159-155c-4b61-bdd5-d71e2e944773',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(TMP_DIRECTORY, '/my_previously_saved_project.afca'),
        lastOpened: '2020-02-01T13:20:55Z',
      },
    },
    MediaFile: {
      '10fd95ee-ba1a-424f-95fb-66a28c91faf1': {
        id: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(ASSETS_DIRECTORY, '/polar_bear_cafe.mp4'),
        lastOpened: '2020-02-01T13:21:21Z',
      },
      'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77': {
        id: 'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(ASSETS_DIRECTORY, '/piggeldy_cat.mp4'),
        lastOpened: '2020-02-01T13:21:20Z',
      },
    },
    ExternalSubtitlesFile: {
      'b3347257-97c4-4c9a-8eae-9bf88a8edc23': {
        id: 'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(ASSETS_DIRECTORY, '/pbc_jp.ass'),
        lastOpened: '2020-02-01T13:21:21Z',
      },
    },
    VttConvertedSubtitlesFile: {
      'd680807d-3a5f-4a25-967f-71871b7d5057': {
        id: 'd680807d-3a5f-4a25-967f-71871b7d5057',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe.mp4_2_d680807d-3a5f-4a25-967f-71871b7d5057.vtt'
        ),
        lastOpened: '2020-02-01T13:21:21Z',
      },
      'b3347257-97c4-4c9a-8eae-9bf88a8edc23': {
        id: 'b3347257-97c4-4c9a-8eae-9bf88a8edc23',
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
        id: '10fd95ee-ba1a-424f-95fb-66a28c91faf1',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe.mp4_10fd95ee-ba1a-424f-95fb-66a28c91faf1.png'
        ),
        lastOpened: '2020-02-01T13:21:21Z',
      },
      'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77': {
        id: 'bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/piggeldy_cat.mp4_bb2bd7fe-4ead-48aa-bad5-88df7a1b5e77.png'
        ),
        lastOpened: '2020-02-01T13:21:20Z',
      },
    },
    ConstantBitrateMp3: {},
    VideoStillImage: {
      '632a6cff-7fd7-4d0f-b657-0b9636204261': {
        id: '632a6cff-7fd7-4d0f-b657-0b9636204261',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe_10-280_632a6cff-7fd7-4d0f-b657-0b9636204261.png'
        ),
        lastOpened: '2020-02-01T13:21:00Z',
      },
      'a272b282-4d89-4af0-9d17-baa807793f1f': {
        id: 'a272b282-4d89-4af0-9d17-baa807793f1f',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe_16-440_a272b282-4d89-4af0-9d17-baa807793f1f.png'
        ),
        lastOpened: '2020-02-01T13:21:08Z',
      },
      '6fce08e8-9312-4930-9601-c14b470e57ab': {
        id: '6fce08e8-9312-4930-9601-c14b470e57ab',
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '/polar_bear_cafe_78-180_6fce08e8-9312-4930-9601-c14b470e57ab.png'
        ),
        lastOpened: '2020-02-01T13:21:19Z',
      },
    },
  },
}
