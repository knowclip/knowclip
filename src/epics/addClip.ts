import {
  filter,
  map,
  takeUntil,
  takeLast,
  take,
  switchMap,
  flatMap,
} from 'rxjs/operators'
import { fromEvent, merge, from, of } from 'rxjs'
import * as r from '../redux'
import { toWaveformX } from '../utils/waveformCoordinates'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'
import { uuid } from '../utils/sideEffects'

const pendingClipIsBigEnough = (state: AppState) => {
  const pendingClip = r.getPendingClip(state)
  if (!pendingClip) return false

  const { start, end } = pendingClip
  return Math.abs(end - start) >= r.CLIP_THRESHOLD
}

const addClipEpic: AppEpic = (
  action$,
  state$,
  { window, setCurrentTime, document }
) =>
  fromEvent<WaveformMousedownEvent>(document, 'waveformMousedown').pipe(
    filter(
      waveformMousedown =>
        !r.getClipEdgeAt(
          state$.value,
          r.getXAtMilliseconds(state$.value, waveformMousedown.milliseconds)
        )
    ),
    // if mousedown falls on edge of clip
    // then start stretchy epic instead of clip epic
    switchMap(waveformMousedown => {
      const mediaFile = r.getCurrentMediaFile(state$.value)
      if (!mediaFile) throw new Error('No current media metadata')
      const mouseups = fromEvent(window, 'mouseup').pipe(take(1))
      // this should be used also in stretch epic, i guess at any reference to waveform x
      const factor =
        state$.value.waveform.stepsPerSecond * state$.value.waveform.stepLength
      const withinValidTime = (x: number) =>
        Math.max(0, Math.min(x, mediaFile.durationSeconds * factor))

      const pendingClips = fromEvent<MouseEvent>(window, 'mousemove').pipe(
        map(mousemove => {
          mousemove.preventDefault()
          return r.setPendingClip({
            start: withinValidTime(
              r.getXAtMilliseconds(state$.value, waveformMousedown.milliseconds)
            ), // should start be called origin instead to match with stretch thing?
            end: withinValidTime(
              toWaveformX(
                mousemove,
                waveformMousedown.svg,
                r.getWaveformViewBoxXMin(state$.value)
              )
            ),
          })
        }),
        takeUntil(mouseups)
      )

      const pendingClipEnds = pendingClips.pipe(
        takeLast(1),
        flatMap(pendingClipAction => {
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

          const tooSmall =
            pendingClipOverlaps || !pendingClipIsBigEnough(state$.value)

          const newTime = r.getSecondsAtX(
            state$.value,
            tooSmall
              ? Math.max(pendingClip.start, pendingClip.end)
              : Math.min(pendingClip.start, pendingClip.end)
          )
          setCurrentTime(newTime)

          // maybe later, do stretch + merge for overlaps.
          if (tooSmall) return of(r.clearPendingClip())

          const fields = r.getNewFieldsFromLinkedSubtitles(
            state$.value,
            currentNoteType,
            pendingClip
          )
          const { clip, flashcard } = r.getNewClipAndCard(
            state$.value,
            pendingClip,
            currentFileId,
            uuid(),
            fields
          )
          return from([
            ...(Object.values(fields).some(fieldValue => fieldValue.trim())
              ? []
              : [r.startEditingCards()]),
            r.addClip(clip, flashcard),
          ])
        })
      )
      return merge(pendingClips, pendingClipEnds)
    })
  )

export default addClipEpic
