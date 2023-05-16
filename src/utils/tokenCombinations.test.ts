import { getTokenCombinations } from './tokenCombinations'
import { describe, it, expect } from 'vitest'

describe('getTokenCombinations', () => {
  it('gives all combinations for five items in right order', () => {
    expect(
      getTokenCombinations(['das', 'licht', 'spiegelt', 'sich', 'in'])
    ).toMatchSnapshot()
  })
})
