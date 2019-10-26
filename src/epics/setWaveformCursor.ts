import { fromEvent, Observable, of, empty } from 'rxjs'
import { map, flatMap, takeWhile, startWith, filter } from 'rxjs/operators'
import { Epic, ofType } from 'redux-observable'
import { setWaveformCursor } from '../actions'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { isLoadFileSuccess } from '../utils/files'

const setWaveformCursorEpic: AppEpic = (
  action$,
  state$,
  { document, getWaveformSvgWidth, setCurrentTime, getCurrentTime }
) =>
  action$.pipe(
    filter<Action, LoadFileSuccessWith<MediaFileRecord>>(
      isLoadFileSuccess('MediaFile')
    ),
    flatMap<LoadFileSuccessWith<MediaFileRecord>, Observable<Action>>(() =>
      fromEvent<Event>(
        document,
        'timeupdate',
        // @ts-ignore
        true
      ).pipe(
        takeWhile(() =>
          Boolean(r.getCurrentMediaFileConstantBitratePath(state$.value))
        ),
        map(() => {
          const viewBox = state$.value.waveform.viewBox

          const highlightedId = r.getHighlightedClipId(state$.value)
          const highlightedClip =
            highlightedId && r.getClip(state$.value, highlightedId)
          const timeToLoop =
            highlightedClip &&
            r.isLoopOn(state$.value) &&
            getCurrentTime() >=
              r.getSecondsAtX(state$.value, highlightedClip.end)
          if (highlightedClip && timeToLoop) {
            setCurrentTime(r.getSecondsAtX(state$.value, highlightedClip.start))
          }

          const newX = Math.round(
            highlightedClip && timeToLoop
              ? highlightedClip.start
              : getCurrentTime() * 50
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
        }),
        startWith(setWaveformCursor(0, { xMin: 0 }))
      )
    )
  )

export default setWaveformCursorEpic
