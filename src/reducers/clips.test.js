import clips from './clips'
import newClip from '../utils/newClip'
import * as r from '../redux'

describe('clips reducer', () => {
  const fileId = 'fileId'
  const noteType = 'Transliteration'
  const oldState = clips(
    {
      byId: {
        a: newClip({ start: 1, end: 1.5 }, fileId, 'a', noteType),
        b: newClip({ start: 2, end: 2.5 }, fileId, 'b', noteType),
        c: newClip({ start: 3, end: 3.5 }, fileId, 'c', noteType),
      },
      idsByMediaFileId: {
        [fileId]: ['a', 'b', 'c'],
      },
    },
    { type: '@@INIT' }
  )

  it('adds to byId and idsByMediaFileId during ADD_CLIP', () => {
    const clip = newClip({ start: 2.75, end: 3 }, fileId, 'b-c', noteType)
    const action = r.addClip(clip)
    const newState = clips(oldState, action)
    expect(newState.idsByMediaFileId[fileId]).toEqual(['a', 'b', 'b-c', 'c'])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      [clip.id]: clip,
    })
  })

  it('adds to byId and idsByMediaFileId during ADD_CLIP', () => {
    const clip = newClip({ start: 4, end: 4.5 }, fileId, 'd', noteType)
    const action = r.addClip(clip)
    const newState = clips(oldState, action)
    expect(newState.idsByMediaFileId[fileId]).toEqual(['a', 'b', 'c', 'd'])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      [clip.id]: clip,
    })
  })

  it('adds to byId and idsByMediaFileId during ADD_CLIPS', () => {
    const bC1 = newClip({ start: 2.75, end: 2.8 }, fileId, 'b-c1', noteType)
    const bC2 = newClip({ start: 2.85, end: 3 }, fileId, 'b-c2', noteType)

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
    const state = clips(
      {
        byId: {
          a: newClip({ start: 1, end: 1.5 }, fileId, 'a', noteType),
          b: newClip({ start: 2, end: 2.5 }, fileId, 'b', noteType),
          c: newClip({ start: 3, end: 3.5 }, fileId, 'c', noteType),
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
            a: newClip({ start: 1, end: 2.5 }, fileId, 'a', noteType),
            c: newClip({ start: 3, end: 3.5 }, fileId, 'c', noteType),
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
