import clips from './clips'
import * as r from '../redux'

const newClip = (
  { start, end }: { start: number; end: number },
  fileId: MediaFileId,
  id: ClipId,
  fields: TransliterationFlashcardFields
): Clip => ({
  start,
  end,
  fileId,
  id,
  flashcard: {
    id,
    type: 'Transliteration',
    fields: fields,
    tags: [],
  },
})

describe('clips reducer', () => {
  const fileId = 'fileId'
  const transliterationFields = {
    pronunciation: 'a',
    meaning: 'aaa',
    transcription: 'asdf',
    notes: 'hey',
  }
  const oldState = clips(
    {
      byId: {
        a: newClip({ start: 1, end: 1.5 }, fileId, 'a', transliterationFields),
        b: newClip({ start: 2, end: 2.5 }, fileId, 'b', transliterationFields),
        c: newClip({ start: 3, end: 3.5 }, fileId, 'c', transliterationFields),
      },
      idsByMediaFileId: {
        [fileId]: ['a', 'b', 'c'],
      },
    },
    { type: '@@INIT' }
  )

  it('adds to byId and idsByMediaFileId during ADD_CLIP', () => {
    const clip = newClip(
      { start: 2.75, end: 3 },
      fileId,
      'b-c',
      transliterationFields
    )
    const action = r.addClip(clip)
    const newState = clips(oldState, action)
    expect(newState.idsByMediaFileId[fileId]).toEqual(['a', 'b', 'b-c', 'c'])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      [clip.id]: clip,
    })
  })

  it('adds to byId and idsByMediaFileId during ADD_CLIP', () => {
    const clip = newClip(
      { start: 4, end: 4.5 },
      fileId,
      'd',
      transliterationFields
    )
    const action = r.addClip(clip)
    const newState = clips(oldState, action)
    expect(newState.idsByMediaFileId[fileId]).toEqual(['a', 'b', 'c', 'd'])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      [clip.id]: clip,
    })
  })

  it('adds to byId and idsByMediaFileId during ADD_CLIPS', () => {
    const bC1 = newClip(
      { start: 2.75, end: 2.8 },
      fileId,
      'b-c1',
      transliterationFields
    )
    const bC2 = newClip(
      { start: 2.85, end: 3 },
      fileId,
      'b-c2',
      transliterationFields
    )

    const newClips = [bC1, bC2]
    const action = r.addClips(newClips, fileId)
    const newState = clips(oldState, action)
    expect(newState.idsByMediaFileId[fileId]).toEqual([
      'a',
      'b',
      'b-c1',
      'b-c2',
      'c',
    ])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      'b-c1': bC1,
      'b-c2': bC2,
    })
  })

  it('merges clips', () => {
    const mergedFields = {
      pronunciation: 'a\na',
      meaning: 'aaa\naaa',
      transcription: 'asdf\nasdf',
      notes: 'hey\nhey',
    }
    const state = clips(
      {
        byId: {
          a: newClip(
            { start: 1, end: 1.5 },
            fileId,
            'a',
            transliterationFields
          ),
          b: newClip(
            { start: 2, end: 2.5 },
            fileId,
            'b',
            transliterationFields
          ),
          c: newClip(
            { start: 3, end: 3.5 },
            fileId,
            'c',
            transliterationFields
          ),
        },
        idsByMediaFileId: {
          [fileId]: ['a', 'b', 'c'],
        },
      },
      { type: '@@INIT' }
    )
    const mergeAction = r.mergeClips(['a', 'b'])
    expect(clips(state, mergeAction)).toEqual(
      clips(
        {
          byId: {
            a: newClip({ start: 1, end: 2.5 }, fileId, 'a', mergedFields),
            c: newClip(
              { start: 3, end: 3.5 },
              fileId,
              'c',
              transliterationFields
            ),
          },
          idsByMediaFileId: {
            [fileId]: ['a', 'c'],
          },
        },
        { type: '@@INIT' }
      )
    )
  })
})
