export const areSelectionsEqual = (
  a: WaveformSelection | null,
  b: WaveformSelection | null
): boolean => {
  return a?.id === b?.id
}
