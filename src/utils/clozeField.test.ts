import { unescapeClozeField } from './clozeField'

describe('unescapeClozeField', () => {
  it('unescapes single cloze deletion', () => {
    const text = '笹を<c1>食べながら</c>のんびりするのは最高だなぁ'
    expect(unescapeClozeField(text)).toEqual({
      text: '笹を食べながらのんびりするのは最高だなぁ',
      clozeDeletions: [{ ranges: [{ start: 2, end: 7 }] }],
    })
  })
})
