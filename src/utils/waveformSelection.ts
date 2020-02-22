export const areSelectionsEqual = (
  a: WaveformSelection | null,
  b: WaveformSelection | null
): boolean => {
  if (a && a.type === 'Preview' && b && b.type === 'Preview')
    return a.index === b.index
  if (a && a.type === 'Clip' && b && b.type === 'Clip') return a.id === b.id

  return a === b
}
