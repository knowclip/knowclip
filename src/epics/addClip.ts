import {
  filter,
  map,
  takeUntil,
  takeLast,
  take,
  switchMap,
} from 'rxjs/operators'
import { fromEvent, merge } from 'rxjs'
import * as r from '../redux'
import {
  toWaveformX,
} from '../utils/waveformCoordinates'
import uuid from 'uuid/v4'
import newClip from '../utils/newClip'
import { AppEpic } from '../types/AppEpic'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'

const pendingClipIsBigEnough = (state: AppState) => {
  const pendingClip = r.getPendingClip(state)
  if (!pendingClip) return false

  const { start, end } = pendingClip
  return Math.abs(end - start) >= r.CLIP_THRESHOLD
}

const addClipEpic: AppEpic = (
  action$,
  state$,
  { window, getWaveformSvgElement, document }
) =>
  fromEvent<WaveformMousedownEvent>(document, 'waveformMousedown').pipe(
    filter(
      waveformMousedown =>
        !r.getClipEdgeAt(state$.value, waveformMousedown.x)
    )
    ,
    // if mousedown falls on edge of clip
    // then start stretchy epic instead of clip epic
    switchMap(waveformMousedown => {
      const mediaFileRecord = r.getCurrentMediaFileRecord(state$.value)
      if (!mediaFileRecord) throw new Error('No current media metadata')
      const mouseups = fromEvent(window, 'mouseup').pipe(take(1))
      // this should be used also in stretch epic, i guess at any reference to waveform x
      const factor =
        state$.value.waveform.stepsPerSecond * state$.value.waveform.stepLength
      const withinValidTime = (x: number) =>
        Math.max(0, Math.min(x, mediaFileRecord.durationSeconds * factor))

      const svgElement = getWaveformSvgElement()
      if (!svgElement) throw new Error('Waveform disappeared')

      const pendingClips = fromEvent<MouseEvent>(window, 'mousemove').pipe(
        map(mousemove => {
          mousemove.preventDefault()
          return r.setPendingClip({
            start: withinValidTime(waveformMousedown.x), // should start be called origin instead to match with stretch thing?
            end: withinValidTime(
              toWaveformX(
                mousemove,
                svgElement,
                r.getWaveformViewBoxXMin(state$.value)
              )
            ),
          })
        }),
        takeUntil(mouseups)
      )

      const pendingClipEnds = pendingClips.pipe(
        takeLast(1),
        map(pendingClipAction => {
          const { clip: pendingClip } = pendingClipAction
          const clipsOrder = r.getCurrentFileClipsOrder(state$.value)
          const pendingClipOverlaps = [
            r.getClipIdAt(state$.value, pendingClip.start),
            r.getClipIdAt(state$.value, pendingClip.end),
          ].some(id => id && clipsOrder.includes(id))
          const currentNoteType = r.getCurrentNoteType(state$.value)
          const currentFileId = r.getCurrentFileId(state$.value)
          if (!currentNoteType)
            throw new Error('Could not find current file id') // necessary?
          if (!currentFileId)
            throw new Error('Could not find current note type')

          return pendingClipOverlaps || !pendingClipIsBigEnough(state$.value)
            ? // maybe later, do stretch + merge for overlaps.
            r.clearPendingClip()
            : r.addClip(
              newClip(
                pendingClip,
                currentFileId,
                uuid(),
                r.getNewFieldsFromLinkedSubtitles(
                  state$.value,
                  currentNoteType,
                  pendingClip
                ),
                r.getDefaultTags(state$.value)
              )
            )
        })
      )
      return merge(pendingClips, pendingClipEnds)
    })
  )

export default addClipEpic
