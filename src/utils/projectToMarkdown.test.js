//@flow
import projectToMarkdown from './projectToMarkdown'
import reducer from '../reducers'
import newClip from '../utils/newClip'

describe('projectToMarkdown', () => {
  const baseState: AppState = reducer(undefined, { type: '@@INIT' })
  const mediaFileId = 'mediaFileId'

  const noteType: NoteType = {
    id: '879ec327-80c2-4723-88e4-21c550f30ad6',
    name: 'Japanese',
    fields: [
      {
        id: 'jp',
        name: 'Japanese',
      },
      {
        id: 'rj',
        name: 'Romaji',
      },
      {
        id: 'en',
        name: 'English',
      },
      {
        id: 'notes',
        name: 'Notes',
      },
    ],
    useTagsField: true,
  }
  const newClipWithCard = (
    id,
    start,
    end,
    [jp, rj, en, notes],
    tags
  ): Clip => ({
    ...newClip({ start, end }, mediaFileId, id, noteType, []),
    flashcard: {
      id,
      fields: { jp, rj, en, notes },
      tags,
    },
  })

  const projectMetadata: ProjectMetadata = {
    error: null,
    id: 'xxx',
    filePath: '/xxx.afca',
    name: 'Basic Japanese',
    mediaFilePaths: [
      {
        filePath: '/xxx.mp4',
        constantBitrateFilePath: '/xxx.mp4',
        error: null,
        metadata: {
          durationSeconds: 60,
          format: 'mp4 xxx xxx',
          isVideo: true,
          id: mediaFileId,
          name: 'Eetto',
        },
      },
    ],
  }

  const state: AppState = {
    ...baseState,
    projects: {
      allIds: [projectMetadata.id],
      byId: {
        [projectMetadata.id]: projectMetadata,
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

  console.log(state.clips.byId.clip1)

  it('makes markdown file', () => {
    const result = projectToMarkdown(state, projectMetadata.id, noteType)

    console.log(result)

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

// import * as r from '../redux'
// import formatTime from '../utils/formatTime'

// const flatten = [(a, b) => a.concat(b), []]

// const projectToMarkdown = (
//   state: AppState,
//   projectId: ProjectId,
//   noteType: NoteType
// ): string => {
//   const projectMetadata = r.getProjectMetadata(state, projectId)
//   if (!projectMetadata) throw new Error('Could not find project')

//   const mediaMetadata = r.getProjectMediaMetadata(state, projectId)

//   return ([
//     `#${projectMetadata.name}`,
//     ...mediaMetadata
//       .map(metadata => {
//         return [
//           `##${metadata.name}`,
//           ...r
//             .getClips(state, metadata.id)
//             .map(clip => {
//               const clipTime = r.getClipTime(state, clip.id) || {}
//               return [
//                 clipTime
//                   ? `${formatTime(clipTime.start)} - ${formatTime(
//                       clipTime.end
//                     )}`
//                   : '',
//                 ...noteType.fields.map(f => clip.flashcard.fields[f.id]),
//               ]
//             })
//             .reduce(...flatten)
//             .map(rawString => rawString.replace('\n', '  \n')),
//         ]
//       })
//       .reduce(...flatten),
//   ]: Array<string>).join('\n')
// }

// export default projectToMarkdown
