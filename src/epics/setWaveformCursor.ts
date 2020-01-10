import { fromEvent, Observable } from 'rxjs'
import { map, startWith, filter, switchMap } from 'rxjs/operators'
import { setWaveformCursor } from '../actions'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { isOpenFileSuccess } from '../utils/files'

export const setCursor = (
  state: AppState,
  currentTime: number,
  { setCurrentTime, getWaveformSvgWidth }: EpicsDependencies
) => {
  const viewBox = state.waveform.viewBox

  const highlightedId = r.getHighlightedClipId(state)
  const highlightedClip = highlightedId && r.getClip(state, highlightedId)
  const timeToLoop =
    highlightedClip &&
    r.isLoopOn(state) &&
    currentTime >= r.getSecondsAtX(state, highlightedClip.end)
  if (highlightedClip && timeToLoop) {
    setCurrentTime(r.getSecondsAtX(state, highlightedClip.start))
  }

  const newX = Math.round(
    highlightedClip && timeToLoop ? highlightedClip.start : currentTime * 50
  )
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
        map(() => setCursor(state$.value, effects.getCurrentTime(), effects)),
        startWith(setWaveformCursor(0, { xMin: 0 }))
      )
    )
  )

export default setWaveformCursorEpic
