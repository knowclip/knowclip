export const arrayToMapById = <T extends { id: ClipId }>(
  array: T[]
): Record<ClipId, T> =>
  array.reduce(
    (all, item) => {
      all[item.id] = item
      return all
    },
    {} as Record<ClipId, T>
  )
