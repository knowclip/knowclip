import { trimClozeRangeOverlaps } from './clozeRanges'
import { describe, it, expect } from 'vitest'

describe('trimClozeRangeOverlaps', () => {
  const deletions: ClozeDeletion[] = [
    {
      ranges: [
        {
          start: 1,
          end: 4,
        },
        {
          start: 8,
          end: 9,
        },
        {
          start: 11,
          end: 12,
        },
        {
          start: 17,
          end: 18,
        },
      ],
    },
    {
      ranges: [
        {
          start: 13,
          end: 14,
        },
      ],
    },
    {
      ranges: [
        {
          start: 5,
          end: 7,
        },
        {
          start: 14,
          end: 16,
        },
      ],
    },
    {
      ranges: [
        {
          start: 4,
          end: 5,
        },
        {
          start: 7,
          end: 8,
        },
        {
          start: 12,
          end: 13,
        },
        {
          start: 16,
          end: 17,
        },
      ],
    },
  ]

  it('handles complex overlaps', () => {
    expect(
      trimClozeRangeOverlaps(
        deletions,
        { ranges: [{ start: 0, end: 14 }] },
        1
      )[1]
    ).toMatchObject({
      ranges: [
        { start: 0, end: 1 },
        { start: 9, end: 11 },
        { start: 13, end: 14 },
      ],
    })
  })
})
