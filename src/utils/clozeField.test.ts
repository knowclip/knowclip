import { unescapeClozeField } from './clozeField'
import { describe, it, expect } from 'vitest'

describe('unescapeClozeField', () => {
  it('unescapes single cloze deletion', () => {
    const text = '笹を{{c1::食べながら}}のんびりするのは最高だなぁ'
    expect(unescapeClozeField(text)).toEqual({
      text: '笹を食べながらのんびりするのは最高だなぁ',
      clozeDeletions: [{ ranges: [{ start: 2, end: 7 }] }],
    })
  })

  it('unescapes multiple cloze deletions', () => {
    const text =
      '{{c2::笹}}を{{c1::食べながら}}{{c2::のんびりするの}}は{{c3::最高}}だなぁ'
    expect(unescapeClozeField(text)).toEqual({
      text: '笹を食べながらのんびりするのは最高だなぁ',
      clozeDeletions: [
        { ranges: [{ start: 2, end: 7 }] },
        {
          ranges: [
            { start: 0, end: 1 },
            { start: 7, end: 14 },
          ],
        },

        { ranges: [{ start: 15, end: 17 }] },
      ],
    })
  })
})
