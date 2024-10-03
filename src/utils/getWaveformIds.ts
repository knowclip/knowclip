export function getWaveformIds(mediaFile: MediaFile) {
  const { durationSeconds } = mediaFile
  const segmentsCount = Math.ceil(durationSeconds / WAVEFORM_SEGMENT_LENGTH)
  return [...Array(segmentsCount).keys()].map((index) =>
    getWaveformId(mediaFile.id, index)
  )
}
export const WAVEFORM_SEGMENT_LENGTH = 5 * 60
// TODO: investigate why this produced an empty
//       second segment for pbc demo video when set to 2 minutes
export function getWaveformId(mediaFileId: MediaFileId, i: number): string {
  return mediaFileId + '__' + i
}
