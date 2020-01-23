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

describe('opening and saving a previously saved project', () => {
  let context: { app: Application | null } = { app: null }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context, 'savedProject', persistedState)

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
    'ece1aa0c-2377-47db-b5d1-47d63e918ca7',
    'cab0801b-3d8d-4cf8-a8d0-575beed8d645',
    'fcf1bb3f-a5a7-419d-9c2c-2d93252f8b71',
  ],
  nowUtcTimestamp: ['2020-01-22T07:50:05Z', '2020-01-22T07:50:10Z'],
}

const persistedState: Partial<AppState> = {
  files: {
    ProjectFile: {
      'e36ca6de-4893-49f5-bca1-4410ace25d46': {
        type: 'ProjectFile',
        id: 'e36ca6de-4893-49f5-bca1-4410ace25d46',
        name: 'My cool saved project',
        noteType: 'Transliteration',
        mediaFileIds: [
          '535935a3-7d72-4238-87ab-1b7a413c1f71',
          'fa462524-bfeb-4434-a506-07858cc97151',
        ],
        error: null,
        lastOpened: '2020-01-20T11:43:27Z',
        lastSaved: '2020-01-20T11:42:45Z',
      },
    },
    MediaFile: {
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
        flashcardFieldsToSubtitlesTracks: {},
        name: 'polar_bear_cafe.mp4',
        durationSeconds: 87.062,
        format: 'mov,mp4,m4a,3gp,3g2,mj2',
        isVideo: true,
        subtitlesTracksStreamIndexes: [2],
      },
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
        filePath: join(TMP_DIRECTORY, 'my_previously_saved_project.afca'),
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
    ExternalSubtitlesFile: {
      '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439': {
        filePath: join(ASSETS_DIRECTORY, 'pbc_jp.ass'),
        status: 'CURRENTLY_LOADED',
        id: '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439',
      },
    },
    VttConvertedSubtitlesFile: {
      '37bd5e91-89c5-491b-9308-533c7be7338a': {
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '95ecfad8a8bf42d562d0e751aa9f8448.vtt'
        ),
        status: 'CURRENTLY_LOADED',
        id: '37bd5e91-89c5-491b-9308-533c7be7338a',
      },
      '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439': {
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '3e59a4e5742e827fdb30511fc40f7e82.vtt'
        ),
        status: 'CURRENTLY_LOADED',
        id: '2f7a98c0-1bf8-44cf-9b0b-4af64fb86439',
      },
    },
    WaveformPng: {
      '535935a3-7d72-4238-87ab-1b7a413c1f71': {
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          '833a0a72cd50d38e26f320c7924f4da6.png'
        ),
        status: 'CURRENTLY_LOADED',
        id: '535935a3-7d72-4238-87ab-1b7a413c1f71',
      },
      'fa462524-bfeb-4434-a506-07858cc97151': {
        filePath: join(
          GENERATED_ASSETS_DIRECTORY,
          'f492c13cdbdf0c59adf3a72b2cb74e04.png'
        ),
        status: 'CURRENTLY_LOADED',
        id: 'fa462524-bfeb-4434-a506-07858cc97151',
      },
    },
    ConstantBitrateMp3: {},
  },
}
