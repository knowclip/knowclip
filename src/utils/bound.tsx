export function bound(number: number, [min, max]: [number, number]) {
  return Math.min(max, Math.max(min, number))
}
