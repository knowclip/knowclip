import files from './files'
import { actions } from '../actions'
import { describe, it, expect } from 'vitest'
import ActionType from '../types/ActionType'

describe('files reducer', () => {
  describe('UpdateFile<linkFlashcardFieldtoSubtitlesTrack>', () => {
    it('links flashcard field to subtitles track', () => {
      const mediaFile = {
        ...baseMediaFile,
        flashcardFieldsToSubtitlesTracks: {},
      }
      const track1Id = mediaFile.subtitles[0].id

      const newState = files(
        {
          ...baseState,
          MediaFile: {
            [mediaFile.id]: mediaFile,
          },
        },
        actions.linkFlashcardFieldToSubtitlesTrack(
          'transcription',
          mediaFile.id,
          track1Id
        )
      )
      expect(newState.MediaFile[mediaFile.id]).toHaveProperty(
        'flashcardFieldsToSubtitlesTracks',
        {
          transcription: track1Id,
        }
      )
    })

    it('allows a track to be linked to only one field', () => {
      const track1Id = baseMediaFile.subtitles[0].id
      const mediaFile = {
        ...baseMediaFile,
        flashcardFieldsToSubtitlesTracks: {
          transcription: track1Id,
        },
      }

      const newState = files(
        {
          ...baseState,
          MediaFile: {
            [mediaFile.id]: mediaFile,
          },
        },
        actions.linkFlashcardFieldToSubtitlesTrack(
          'pronunciation',
          mediaFile.id,
          track1Id
        )
      )
      expect(newState.MediaFile[mediaFile.id]).toHaveProperty(
        'flashcardFieldsToSubtitlesTracks',
        {
          pronunciation: track1Id,
        }
      )
    })

    it('unlinks a field from a track', () => {
      const track1Id = baseMediaFile.subtitles[0].id
      const mediaFile = {
        ...baseMediaFile,
        flashcardFieldsToSubtitlesTracks: {
          transcription: track1Id,
        },
      }

      const newState = files(
        {
          ...baseState,
          MediaFile: {
            [mediaFile.id]: mediaFile,
          },
        },
        actions.linkFlashcardFieldToSubtitlesTrack(
          'transcription',
          mediaFile.id,
          null
        )
      )
      expect(newState.MediaFile[mediaFile.id]).toHaveProperty(
        'flashcardFieldsToSubtitlesTracks',
        {}
      )
    })
  })
})

const baseMediaFile: MediaFile = {
  id: '535935a3-7d72-4238-87ab-1b7a413c1f71',
  type: 'MediaFile',
  parentId: 'e36ca6de-4893-49f5-bca1-4410ace25d46',
  subtitles: [
    {
      type: 'EmbeddedSubtitlesTrack',
      id: '37bd5e91-89c5-491b-9308-533c7be7338a',
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
  width: 1920,
  height: 1080,
  subtitlesTracksStreamIndexes: [2],
}

const baseState: FilesState = files(undefined, {
  type: ActionType.initializeApp,
})
