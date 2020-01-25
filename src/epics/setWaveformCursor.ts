import { fromEvent, Observable, of, from } from 'rxjs'
import { map, startWith, filter, switchMap, flatMap } from 'rxjs/operators'
import { setWaveformCursor } from '../actions'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { isOpenFileSuccess } from '../utils/files'
import highlightClip from './highlightClip'

export const setCursor = (
  state: AppState,
  newlySetTime: number,
  maxX: number,
  { setCurrentTime, getWaveformSvgWidth, isMediaPlaying }: EpicsDependencies
) => {
  const viewBox = state.waveform.viewBox

  const highlightedId = r.getHighlightedClipId(state)
  const highlightedClip = highlightedId && r.getClip(state, highlightedId)
  const timeToLoop =
    highlightedClip &&
    r.isLoopOn(state) &&
    newlySetTime >= r.getSecondsAtX(state, highlightedClip.end)
  if (isMediaPlaying() && highlightedClip && timeToLoop) {
    const highlightedClipStart = r.getSecondsAtX(state, highlightedClip.start)
    setCurrentTime(highlightedClipStart)
  }

  const newX = Math.round(newlySetTime * 50)
  const svgWidth = getWaveformSvgWidth()

  if (newX < viewBox.xMin) {
    return setWaveformCursor(newX, {
      ...viewBox,
      xMin: Math.max(0, newX - svgWidth * 0.9),
    })
  }
  if (newX > svgWidth + viewBox.xMin) {
    return setWaveformCursor(newX, { ...viewBox, xMin: newX })
  }
  return setWaveformCursor(newX)
}

const setWaveformCursorEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter<Action, OpenFileSuccessWith<MediaFile>>(
      isOpenFileSuccess('MediaFile')
    ),
    switchMap<OpenFileSuccessWith<MediaFile>, Observable<Action>>(() =>
      fromEvent<Event>(
        document,
        'timeupdate',
        // @ts-ignore
        true
      ).pipe(
        switchMap(() => {
          const maxX = r.getXAtMilliseconds(
            state$.value,
            (r.getCurrentMediaFile(state$.value) as MediaFile).durationSeconds
          )
          const newCurrentTime = effects.getCurrentTime()
          const highlightedClipId = r.getHighlightedClipId(state$.value)
          const loopingClip = highlightedClipId && r.isLoopOn(state$.value)
          const newClipIdToHighlight = r.getClipIdAt(
            state$.value,
            r.getXAtMilliseconds(state$.value, newCurrentTime * 1000)
          )

          if (
            !loopingClip &&
            newClipIdToHighlight &&
            newClipIdToHighlight !== highlightedClipId
          )
            return from([r.highlightClip(newClipIdToHighlight)])

          const result = of(
            setCursor(state$.value, newCurrentTime, maxX, effects)
          )
          ;(window as any).seeky = false
          return result
        }),
        startWith(setWaveformCursor(0, { xMin: 0 }))
      )
    )
  )

export default setWaveformCursorEpic
