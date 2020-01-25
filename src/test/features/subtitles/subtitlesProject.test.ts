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
  ],
  nowUtcTimestamp: ['2020-01-24T23:44:33Z', '2020-01-24T23:44:38Z'],
}

const persistedState: Partial<AppState> = {
  files: {
    ProjectFile: {
      'e36ca6de-4893-49f5-bca1-4410ace25d46': {
        id: 'e36ca6de-4893-49f5-bca1-4410ace25d46',
        type: 'ProjectFile',
        lastSaved: '2020-01-22T13:43:37Z',
        lastOpened: '2020-01-24T15:09:03Z',
        name: 'Project with subtitles',
        mediaFileIds: [
          'fa462524-bfeb-4434-a506-07858cc97151',
          '535935a3-7d72-4238-87ab-1b7a413c1f71',
        ],
        error: null,
        noteType: 'Transliteration',
      },
    },
    MediaFile: {
      'fa462524-bfeb-4434-a506-07858cc97151': {
        id: 'fa462524-bfeb-4434-a506-07858cc97151',
        type: 'MediaFile',
        parentId: 'e36ca6de-4893-49f5-bca1-4410ace25d46',
        subtitles: [],
        flashcardFieldsToSubtitlesTracks: {},
        name: 'piggeldy_cat.mp4',
        durationSeconds: 58.24,
        format: 'mov,mp4,m4a,3gp,3g2,mj2',
        isVideo: true,
        subtitlesTracksStreamIndexes: [],
      },
      '535935a3-7d72-4238-87ab-1b7a413c1f71': {
        id: '535935a3-7d72-4238-87ab-1b7a413c1f71',
        type: 'MediaFile',
        parentId: 'e36ca6de-4893-49f5-bca1-4410ace25d46',
        subtitles: [
          {
            type: 'EmbeddedSubtitlesTrack',
            id: '37bd5e91-89c5-491b-9308-533c7be7338a',
            streamIndex: 2,
          },
          {
            type: 'ExternalSubtitlesTrack',
            id: '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439',
          },
        ],
        flashcardFieldsToSubtitlesTracks: {
          transcription: '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439',
          meaning: '37bd5e91-89c5-491b-9308-533c7be7338a',
        },
        name: 'polar_bear_cafe.mp4',
        durationSeconds: 87.062,
        format: 'mov,mp4,m4a,3gp,3g2,mj2',
        isVideo: true,
        subtitlesTracksStreamIndexes: [2],
      },
    },
    ExternalSubtitlesFile: {
      '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439': {
        type: 'ExternalSubtitlesFile',
        parentId: '535935a3-7d72-4238-87ab-1b7a413c1f71',
        id: '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439',
        name: 'pbc_jp.ass',
      },
    },
    VttConvertedSubtitlesFile: {
      '37bd5e91-89c5-491b-9308-533c7be7338a': {
        type: 'VttConvertedSubtitlesFile',
        parentId: '535935a3-7d72-4238-87ab-1b7a413c1f71',
        id: '37bd5e91-89c5-491b-9308-533c7be7338a',
        streamIndex: 2,
        parentType: 'MediaFile',
      },
      '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439': {
        type: 'VttConvertedSubtitlesFile',
        id: '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439',
        parentId: '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439',
        parentType: 'ExternalSubtitlesFile',
      },
    },
    WaveformPng: {
      '535935a3-7d72-4238-87ab-1b7a413c1f71': {
        type: 'WaveformPng',
        parentId: '535935a3-7d72-4238-87ab-1b7a413c1f71',
        id: '535935a3-7d72-4238-87ab-1b7a413c1f71',
      },
      'fa462524-bfeb-4434-a506-07858cc97151': {
        type: 'WaveformPng',
        parentId: 'fa462524-bfeb-4434-a506-07858cc97151',
        id: 'fa462524-bfeb-4434-a506-07858cc97151',
      },
    },
    ConstantBitrateMp3: {},
  },
  fileAvailabilities: {
    ProjectFile: {
      'e36ca6de-4893-49f5-bca1-4410ace25d46': {
        filePath: join(TMP_DIRECTORY, 'project_with_subtitles.afca'),
        status: 'CURRENTLY_LOADED',
        id: 'e36ca6de-4893-49f5-bca1-4410ace25d46',
      },
    },
    MediaFile: {
      '535935a3-7d72-4238-87ab-1b7a413c1f71': {
        filePath: join(ASSETS_DIRECTORY, 'polar_bear_cafe.mp4'),
        status: 'CURRENTLY_LOADED',
        id: '535935a3-7d72-4238-87ab-1b7a413c1f71',
      },
      'fa462524-bfeb-4434-a506-07858cc97151': {
        filePath: join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4'),
        status: 'CURRENTLY_LOADED',
        id: 'fa462524-bfeb-4434-a506-07858cc97151',
      },
    },
    ExternalSubtitlesFile: {},
    VttConvertedSubtitlesFile: {
      '37bd5e91-89c5-491b-9308-533c7be7338a': {
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          'cafbc25b9c6405df0dd0c77173539bcd.vtt'
        ),
        status: 'CURRENTLY_LOADED',
        id: '37bd5e91-89c5-491b-9308-533c7be7338a',
      },
    },
    WaveformPng: {
      '535935a3-7d72-4238-87ab-1b7a413c1f71': {
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '68a8d8c5862e344e7d032006fe1d2c0a.png'
        ),
        status: 'CURRENTLY_LOADED',
        id: '535935a3-7d72-4238-87ab-1b7a413c1f71',
      },
      'fa462524-bfeb-4434-a506-07858cc97151': {
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          testId,
          '992896afa3b7fd044dd8a60bdba4c730.png'
        ),
        status: 'CURRENTLY_LOADED',
        id: 'fa462524-bfeb-4434-a506-07858cc97151',
      },
    },
    ConstantBitrateMp3: {},
  },
}
