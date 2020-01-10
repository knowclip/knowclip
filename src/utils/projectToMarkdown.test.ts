import projectToMarkdown from './projectToMarkdown'
import reducer from '../reducers'
import newClip from '../utils/newClip'
import { initialState } from '../reducers/files'

describe('projectToMarkdown', () => {
  const baseState = reducer(undefined, { type: '@@INIT' })
  const mediaFileId = 'mediaFileId'

  const noteType = 'Transliteration'
  const newClipWithCard = (
    id: string,
    start: number,
    end: number,
    [transcription, pronunciation, meaning, notes]: [
      string,
      string,
      string,
      string
    ],
    tags: string[]
  ) =>
    newClip(
      { start, end },
      mediaFileId,
      id,
      {
        transcription,
        pronunciation,
        meaning,
        notes,
      },
      tags
    )

  const projectMetadata: ProjectFile = {
    error: null,
    type: 'ProjectFile',
    id: 'xxx',
    name: 'Basic Japanese',
    lastSaved: '2015-11-16T09:44:45Z',
    lastOpened: '2015-11-16T09:44:45Z',

    noteType: 'Transliteration',
    mediaFileIds: [mediaFileId],
  }

  const state: AppState = {
    ...baseState,
    files: {
      ...initialState,
      ProjectFile: { [projectMetadata.id]: projectMetadata },
      MediaFile: {
        [mediaFileId]: {
          durationSeconds: 60,
          format: 'mp4 xxx xxx',
          isVideo: true,
          id: mediaFileId,
          name: 'Eetto',
          type: 'MediaFile',
          parentId: projectMetadata.id,
          subtitles: [],
          flashcardFieldsToSubtitlesTracks: {},
          subtitlesTracksStreamIndexes: [],
        },
      },
    },
    clips: {
      ...baseState.clips,
      byId: {
        clip1: newClipWithCard(
          'clip1',
          10,
          160,
          [
            '女の子は言葉を言いません。',
            'Onnanóko-wa kotobá-o iimasén.',
            "[The] girl doesn't say [a] word. (polite)",
            `"iimasén" in plain form = "iwanai"

"iimásu" in plain form = "iu".`,
          ],
          ['jgr1-1-1']
        ),
        clip2: newClipWithCard(
          'clip2',
          200,
          350,
          [
            '女の子は言葉を言いません。',
            'Onnanóko-wa kotobá-o iimasén.',
            "[The] girl doesn't say [a] word. (polite)",
            '"iimasén" in plain form = "iwanai"\n"iimásu" in plain form = "iu".',
          ],
          ['jgr1-1-1']
        ),
        clip3: newClipWithCard(
          'clip3',
          400,
          550,
          [
            '女の子は言葉を言いません。',
            'Onnanóko-wa kotobá-o iimasén.',
            "[The] girl doesn't say [a] word. (polite)",
            '"iimasén" in plain form = "iwanai"\n"iimásu" in plain form = "iu".',
          ],
          ['jgr1-1-1', 'taggytag']
        ),
      },
      idsByMediaFileId: { [mediaFileId]: ['clip1', 'clip2', 'clip3'] },
    },
  }

  it('makes markdown file', () => {
    const result = projectToMarkdown(state, projectMetadata.id, noteType)

    expect(result).toEqual(
      [
        `# Basic Japanese`,
        '',
        `## Eetto`,
        '',
        `**0:00 - 0:03** _#jgr1-1-1_`,
        `* 女の子は言葉を言いません。`,
        `* Onnanóko-wa kotobá-o iimasén.`,
        `* [The] girl doesn't say [a] word. (polite)`,
        `* "iimasén" in plain form = "iwanai"<br><br>"iimásu" in plain form = "iu".`, // double line break
        '',
        `**0:04 - 0:07** _#jgr1-1-1_`,
        `* 女の子は言葉を言いません。`,
        `* Onnanóko-wa kotobá-o iimasén.`,
        `* [The] girl doesn't say [a] word. (polite)`,
        `* "iimasén" in plain form = "iwanai"<br>"iimásu" in plain form = "iu".`,
        '',
        `**0:08 - 0:11** _#jgr1-1-1_ _#taggytag_`,
        `* 女の子は言葉を言いません。`,
        `* Onnanóko-wa kotobá-o iimasén.`,
        `* [The] girl doesn't say [a] word. (polite)`,
        `* "iimasén" in plain form = "iwanai"<br>"iimásu" in plain form = "iu".`,
      ].join('\n')
    )
  })
})
