import { lemmatize } from './yomichanDictionary'

describe('lemmatize', () => {
  it('works with 描いた', () => {
    expect(lemmatize('描いた').map((l) => l.text)).toContain('描く')
  })

  it('works with 出来ます', () => {
    expect(lemmatize('出来ます').map((l) => l.text)).toEqual(['出来る'])
  })

  it('works with 表されます', () => {
    expect(lemmatize('表されます').map((l) => l.text)).toEqual([
      '表される',
      '表する',
      '表す',
      '表さる',
    ])
  })

  it('works with されている', () => {
    expect(lemmatize('されている').map((l) => l.text)).toEqual([
      'されて',
      'される',
      'する',
      'す',
      'さる',
      'されつ',
      'されてる',
      'されつ',
    ])
  })
})
