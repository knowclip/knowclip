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
  test('saves and closes project', () => saveAndCloseProject(setup))

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
      '14048b9b-8f7e-4491-a618-5507aa6ceba7': {
        type: 'ProjectFile',
        id: '14048b9b-8f7e-4491-a618-5507aa6ceba7',
        name: 'My cool saved project',
        noteType: 'Transliteration',
        mediaFileIds: [
          'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02',
          'f1190a9a-8275-4119-9feb-26ce53a68c5e',
        ],
        error: null,
        lastOpened: '2020-01-28T10:05:31Z',
        lastSaved: '2020-01-28T10:05:31Z',
      },
    },
    MediaFile: {
      'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02': {
        id: 'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02',
        type: 'MediaFile',
        parentId: '14048b9b-8f7e-4491-a618-5507aa6ceba7',
        subtitles: [
          {
            type: 'EmbeddedSubtitlesTrack',
            id: '5d9bc376-2716-4bbb-95f5-3badfc5e8c47',
            streamIndex: 2,
          },
          {
            type: 'ExternalSubtitlesTrack',
            id: '136042f2-00bc-4d9b-a3a7-3da1b7868c78',
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
      'f1190a9a-8275-4119-9feb-26ce53a68c5e': {
        id: 'f1190a9a-8275-4119-9feb-26ce53a68c5e',
        type: 'MediaFile',
        parentId: '14048b9b-8f7e-4491-a618-5507aa6ceba7',
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
      '136042f2-00bc-4d9b-a3a7-3da1b7868c78': {
        type: 'ExternalSubtitlesFile',
        parentId: 'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02',
        id: '136042f2-00bc-4d9b-a3a7-3da1b7868c78',
        name: 'pbc_jp.ass',
      },
    },
    VttConvertedSubtitlesFile: {
      '5d9bc376-2716-4bbb-95f5-3badfc5e8c47': {
        type: 'VttConvertedSubtitlesFile',
        parentId: 'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02',
        id: '5d9bc376-2716-4bbb-95f5-3badfc5e8c47',
        streamIndex: 2,
        parentType: 'MediaFile',
      },
      '136042f2-00bc-4d9b-a3a7-3da1b7868c78': {
        type: 'VttConvertedSubtitlesFile',
        id: '136042f2-00bc-4d9b-a3a7-3da1b7868c78',
        parentId: '136042f2-00bc-4d9b-a3a7-3da1b7868c78',
        parentType: 'ExternalSubtitlesFile',
      },
    },
    WaveformPng: {
      'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02': {
        type: 'WaveformPng',
        parentId: 'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02',
        id: 'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02',
      },
      'f1190a9a-8275-4119-9feb-26ce53a68c5e': {
        type: 'WaveformPng',
        parentId: 'f1190a9a-8275-4119-9feb-26ce53a68c5e',
        id: 'f1190a9a-8275-4119-9feb-26ce53a68c5e',
      },
    },
    ConstantBitrateMp3: {},
    VideoStillImage: {
      'b40a5006-71f1-4b6d-b219-303a38f3f29e': {
        type: 'VideoStillImage',
        id: 'b40a5006-71f1-4b6d-b219-303a38f3f29e',
        mediaFileId: 'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02',
      },
      'df75ad79-2be6-4cef-b870-9786888f9af5': {
        type: 'VideoStillImage',
        id: 'df75ad79-2be6-4cef-b870-9786888f9af5',
        mediaFileId: 'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02',
      },
    },
  },
  fileAvailabilities: {
    ProjectFile: {
      '14048b9b-8f7e-4491-a618-5507aa6ceba7': {
        filePath: join(TMP_DIRECTORY, 'my_previously_saved_project.afca'),
        status: 'CURRENTLY_LOADED',
        id: '14048b9b-8f7e-4491-a618-5507aa6ceba7',
      },
    },
    MediaFile: {
      'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02': {
        filePath: join(ASSETS_DIRECTORY, 'polar_bear_cafe.mp4'),
        status: 'CURRENTLY_LOADED',
        id: 'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02',
      },
      'f1190a9a-8275-4119-9feb-26ce53a68c5e': {
        filePath: join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4'),
        status: 'CURRENTLY_LOADED',
        id: 'f1190a9a-8275-4119-9feb-26ce53a68c5e',
      },
    },
    ExternalSubtitlesFile: {
      '136042f2-00bc-4d9b-a3a7-3da1b7868c78': {
        filePath: join(ASSETS_DIRECTORY, 'pbc_jp.ass'),
        status: 'CURRENTLY_LOADED',
        id: '136042f2-00bc-4d9b-a3a7-3da1b7868c78',
      },
    },
    VttConvertedSubtitlesFile: {
      '5d9bc376-2716-4bbb-95f5-3badfc5e8c47': {
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '620fffeb0b82a2fe14a6bad161f40e58.vtt'
        ),
      },
    },
    WaveformPng: {
      'ca5642ae-e906-4e3b-90f2-bb5fff5d1c02': {
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          'ddc61a845e870db251cf3a00069d1cde.png'
        ),
      },
      'f1190a9a-8275-4119-9feb-26ce53a68c5e': {
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          'ca194ff7cc6d48c44a2f13381e6aeba6.png'
        ),
      },
    },
    ConstantBitrateMp3: {},
    VideoStillImage: {
      'b40a5006-71f1-4b6d-b219-303a38f3f29e': {
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '73cb06f3983e862ffac8e27174440133.png'
        ),
      },
      'df75ad79-2be6-4cef-b870-9786888f9af5': {
        status: 'CURRENTLY_LOADED',
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '77335888f2c798acb05ebe56f21e6d03.png'
        ),
      },
    },
  },
}
