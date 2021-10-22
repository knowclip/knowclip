import {
  PrimaryClip,
  SecondaryClip,
  WaveformItem,
  WaveformRegion,
} from 'clipwave'
import { GetWaveformItem } from 'clipwave/dist/useWaveform'
import { overlapsSignificantly } from '../../selectors'

export function isWaveformItemSelectable(
  item: WaveformItem,
  region: WaveformRegion,
  regionIndex: number,
  regions: WaveformRegion[],
  getItem: GetWaveformItem
) {
  if (item.start !== region.start) return false

  if (item.clipwaveType === 'Primary') return true
  const overlappingPrimaryClips = getPrimaryClipsOverlappingSecondaryClip(
    regions,
    getItem,
    regionIndex,
    item
  )

  return !overlappingPrimaryClips.length
}

function getPrimaryClipsOverlappingSecondaryClip(
  regions: WaveformRegion[],
  getItem: GetWaveformItem,
  startRegionIndex: number,
  item: SecondaryClip
) {
  const allLocalItemsIds = new Set<string>()

  let regionIndex = startRegionIndex
  while (regions[regionIndex]?.itemIds.includes(item.id)) {
    regions[regionIndex].itemIds.forEach((itemId) =>
      allLocalItemsIds.add(itemId)
    )

    regionIndex++
  }
  allLocalItemsIds.delete(item.id)

  const overlappingPrimaryClips: PrimaryClip[] = []
  allLocalItemsIds.forEach((id) => {
    const overlapped = getItem(id)
    if (
      overlapped?.clipwaveType === 'Primary' &&
      overlapsSignificantly(overlapped, item.start, item.end)
    )
      overlappingPrimaryClips.push(overlapped)
  })

  return overlappingPrimaryClips
}
