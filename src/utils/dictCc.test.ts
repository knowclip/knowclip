import { getDifferingSearchStem, getGermanDifferingStems } from './dictCc'

describe('getDifferingSearchStem', () => {
  it('works with prefix and ending', () => {
    expect(getDifferingSearchStem('einzugehen')).toEqual('geh')
  })

  it('works with gehiessen', () => {
    expect(getDifferingSearchStem('gehießen')).toEqual('hiess')
  })

  it('works with kämst', () => {
    expect(getDifferingSearchStem('kämst')).toEqual('kam')
  })

  it('works with anzutun', () => {
    expect(getDifferingSearchStem('anzutun')).toEqual('tun')
  })

  it('works with ankommen', () => {
    expect(getDifferingSearchStem('ankommen')).toEqual('komm')
  })
})

describe('getGermanStems', () => {
  it('works with prefix and ending', () => {
    expect(getGermanDifferingStems('ankommen [Ort]')).toEqual(['komm'])
  })

  it('works with big entries with complicated punctuation', () => {
    const bigEntry = `'Die' heißt mein Unterrock, und 'der' hängt im Schrank. [regional] [Satz, mit dem Kinder gerügt werden, die von einer (anwesenden) Frau mit 'die' sprechen]`
    expect(getGermanDifferingStems(bigEntry)).toEqual([
      'die',
      'heiss',
      'mein',
      'unterrock',
      'und',
      'der',
      'hang',
      'im',
      'schrank',
    ])
  })

  it('works with mixed alphanumeric and hyphens', () => {
    expect(getGermanDifferingStems(`8-Bit-Architektur`)).toEqual([
      '8',
      'bit',
      'architektur',
    ])
  })
})

//wessentwegen [{m} / {n} {sg}] [veraltet] [weswegen]	on whose account	adv
