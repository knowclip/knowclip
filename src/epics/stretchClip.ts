import { map, switchMap, takeUntil, takeLast } from 'rxjs/operators'
import { fromEvent, from, of, merge, empty } from 'rxjs'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import { toWaveformX } from '../utils/waveformCoordinates'
import { AppEpic } from '../types/AppEpic'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'

const stretchClipEpic: AppEpic = (
  action$,
  state$,
  { window, getWaveformSvgElement, document }
) => {
  const clipMousedowns = fromEvent<WaveformMousedownEvent>(document, 'waveformMousedown').pipe(
    switchMap(({ x }) => {
      const edge = r.getClipEdgeAt(state$.value, x)
      return edge ? of({ x, edge }) : empty()
    }),
    switchMap(mousedownData => {
      const {
        edge: { key, id },
      } = mousedownData
      const pendingStretches = fromEvent<MouseEvent>(window, 'mousemove').pipe(
        takeUntil(fromEvent(window, 'mouseup')),
        map(mousemove => {
          const svgElement = getWaveformSvgElement()
          if (!svgElement) throw new Error('Waveform disappeared')
          return r.setPendingStretch({
            id,
            originKey: key,
            end: toWaveformX(
              mousemove,
              svgElement,
              r.getWaveformViewBoxXMin(state$.value)
            ),
          })
        })
      )

      return merge(
        pendingStretches,
        pendingStretches.pipe(
          takeLast(1),
          switchMap(lastPendingStretch => {
            const {
              stretch: { id, originKey, end },
            } = lastPendingStretch
            const stretchedClip = r.getClip(state$.value, id)

            // if pendingStretch.end is inside a clip separate from stretchedClip,
            // take the start from the earlier and the end from the later,
            // use those as the new start/end of stretchedClip,
            // and delete the separate clip.

            const previousClipId = r.getPreviousClipId(state$.value, id)
            const previousClip =
              previousClipId && r.getClip(state$.value, previousClipId)
            if (previousClip && previousClipId && end <= previousClip.end) {
              return from([
                r.clearPendingStretch(),
                r.mergeClips([id, previousClipId]),
              ])
            }

            const nextClipId = r.getNextClipId(state$.value, id)
            const nextClip = nextClipId && r.getClip(state$.value, nextClipId)
            if (nextClip && nextClipId && end >= nextClip.start) {
              return from([
                r.clearPendingStretch(),
                r.mergeClips([id, nextClipId]),
              ])
            }

            if (
              originKey === 'start' &&
              stretchedClip &&
              stretchedClip.end > end
            ) {
              return from([
                r.clearPendingStretch(),
                r.editClip(id, {
                  start: Math.min(end, stretchedClip.end - r.CLIP_THRESHOLD),
                }),
              ])
            }

            if (
              originKey === 'end' &&
              stretchedClip &&
              end > stretchedClip.start
            ) {
              return from([
                r.clearPendingStretch(),
                r.editClip(id, {
                  end: Math.max(end, stretchedClip.start + r.CLIP_THRESHOLD),
                }),
              ])
            }

            return from([r.clearPendingStretch()])
          })
        )
      )
    })
  )
  return clipMousedowns
}

export default stretchClipEpic
