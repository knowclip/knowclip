export const overlaps = (a: ClozeRange, b: ClozeRange): boolean =>
  a.start < b.end && a.end > b.start

export function trimClozeRangeOverlaps(
  oldDeletions: ClozeDeletion[],
  newDeletion: ClozeDeletion,
  newIndex: number
): ClozeDeletion[] {
  const newDeletions = [...oldDeletions]
  const rangesWithoutOverlaps = oldDeletions.reduce(
    (bottomRanges, { ranges: topRanges }, i) => {
      if (newIndex === i) {
        return bottomRanges
      }
      return bottomRanges.flatMap((bottomRange) => {
        const overlappingTopRanges = topRanges.filter((topRange) =>
          overlaps(topRange, bottomRange)
        )
        if (!overlappingTopRanges.length) {
          return [bottomRange]
        }

        return overlappingTopRanges.reduce(
          (bottomRangeSegments, topRange) => {
            return bottomRangeSegments.flatMap((bottomRangeSegment) => {
              const withoutOverlaps: ClozeRange[] = []
              const overlap = overlaps(topRange, bottomRangeSegment)

              if (overlap) {
                if (bottomRangeSegment.start < topRange.start) {
                  withoutOverlaps.push({
                    start: bottomRangeSegment.start,
                    end: topRange.start,
                  })
                }
                if (bottomRangeSegment.end > topRange.end) {
                  withoutOverlaps.push({
                    start: topRange.end,
                    end: bottomRangeSegment.end,
                  })
                }
              } else {
                withoutOverlaps.push(bottomRangeSegment)
              }

              return withoutOverlaps
            })
          },
          [bottomRange]
        )
      })
    },
    newDeletion.ranges
  )

  const oldRangesAtIndex = oldDeletions[newIndex]
    ? oldDeletions[newIndex].ranges
    : []
  const nothingAdded =
    rangesWithoutOverlaps.length === 0 && oldRangesAtIndex.length === 0
  if (nothingAdded) return oldDeletions

  newDeletions[newIndex] = {
    ranges: rangesWithoutOverlaps.filter((r) => r.start !== r.end),
  }

  return newDeletions
}

export const collapseRanges = (base: ClozeRange[], newRange: ClozeRange) => {
  const ranges: ClozeRange[] = []

  let newMergedRange = newRange
  for (const range of base) {
    const adjacent =
      range.end === newRange.start || newRange.end === range.start
    if (adjacent || overlaps(newRange, range)) {
      newMergedRange = {
        start: Math.min(newMergedRange.start, range.start),
        end: Math.max(newMergedRange.end, range.end),
      }
    } else {
      ranges.push(range)
    }
  }
  ranges.push(newMergedRange)
  ranges.sort((a, b) => a.start - b.start)

  return ranges.length !== base.length ||
    ranges.some((r, i) => r.start !== base[i].start || r.end !== base[i].end)
    ? ranges
    : base
}

export const removeRange = (base: ClozeRange[], toDelete: ClozeRange) => {
  const ranges: ClozeRange[] = []

  for (const range of base) {
    if (overlaps(toDelete, range)) {
      if (toDelete.start > range.start)
        ranges.push({
          start: range.start,
          end: toDelete.start,
        })

      if (toDelete.end < range.end)
        ranges.push({
          start: toDelete.end,
          end: range.end,
        })
    } else {
      ranges.push(range)
    }
  }

  return ranges
}
