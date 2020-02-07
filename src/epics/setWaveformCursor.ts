import { fromEvent, Observable, of, from } from 'rxjs'
import {
  startWith,
  filter,
  switchMap,
  tap,
  ignoreElements,
  flatMap,
} from 'rxjs/operators'
import { setWaveformCursor } from '../actions'
import * as r from '../redux'
import { combineEpics } from 'redux-observable'

let seeking = false

const setWaveformCursorEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter<Action, OpenMediaFileSuccess>(
      (action): action is OpenMediaFileSuccess =>
        action.type === 'OPEN_FILE_SUCCESS' &&
        action.validatedFile.type === 'MediaFile'
    ),
    switchMap<OpenMediaFileSuccess, Observable<Action>>(({ validatedFile }) =>
      fromEvent<Event>(
        document,
        'timeupdate',
        // @ts-ignore
        true
      ).pipe(
        flatMap(() => {
          const state = state$.value
          const newlyUpdatedTime = effects.getCurrentTime()
          const highlightedClip = r.getHighlightedClip(state)
          const highlightedClipId = highlightedClip && highlightedClip.id
          const newClipIdToHighlight = r.getClipIdAt(
            state,
            r.getXAtMilliseconds(state, newlyUpdatedTime * 1000)
          )
          const wasSeeking = seeking
          seeking = false

          const loopImminent =
            !wasSeeking &&
            r.isLoopOn(state) &&
            effects.isMediaPlaying() &&
            highlightedClip &&
            newlyUpdatedTime >= r.getSecondsAtX(state, highlightedClip.end)
          if (loopImminent && highlightedClip) {
            const highlightedClipStart = r.getSecondsAtX(
              state,
              highlightedClip.start
            )
            effects.setCurrentTime(highlightedClipStart)
          }

          if (wasSeeking && newClipIdToHighlight !== highlightedClipId) {
            return from([
              ...(!newClipIdToHighlight
                ? [
                    setCursorAndViewBox(
                      state,
                      newlyUpdatedTime,
                      effects.getWaveformSvgWidth()
                    ),
                  ]
                : []),
              r.highlightClip(newClipIdToHighlight),
            ])
          }

          if (
            !loopImminent &&
            newClipIdToHighlight &&
            newClipIdToHighlight !== highlightedClipId
          )
            return of(r.highlightClip(newClipIdToHighlight))

          return of(
            setCursorAndViewBox(
              state,
              newlyUpdatedTime,
              effects.getWaveformSvgWidth()
            )
          )
        }),
        startWith(setWaveformCursor(0, { xMin: 0 }))
      )
    )
  )

const setCursorAndViewBox = (
  state: AppState,
  newlySetTime: number,
  svgWidth: number
) => {
  const viewBox = state.waveform.viewBox

  const newX = Math.round(newlySetTime * 50)

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

type OpenMediaFileSuccess = {
  type: 'OPEN_FILE_SUCCESS'
  filePath: string
  validatedFile: MediaFile
  timestamp: string
}

const seekingTrackerEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter<Action, OpenMediaFileSuccess>(
      (action): action is OpenMediaFileSuccess =>
        action.type === 'OPEN_FILE_SUCCESS' &&
        action.validatedFile.type === 'MediaFile'
    ),
    switchMap<OpenMediaFileSuccess, Observable<Action>>(({ validatedFile }) =>
      fromEvent<Event>(
        document,
        'seeking',
        // @ts-ignore
        true
      ).pipe(
        tap(() => (seeking = true)),
        startWith(() => of(null).pipe(tap(() => (seeking = false)))),
        ignoreElements()
      )
    )
  )

export default combineEpics(setWaveformCursorEpic, seekingTrackerEpic)
