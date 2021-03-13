import { fromEvent, Observable, of, from } from 'rxjs'
import {
  startWith,
  filter,
  switchMap,
  tap,
  ignoreElements,
  mergeMap,
} from 'rxjs/operators'
import { actions } from '../actions'
import r from '../redux'
import { combineEpics } from 'redux-observable'
import { areSelectionsEqual } from '../utils/waveformSelection'
import { overlapsSignificantly } from '../selectors'

let seeking = false

const setCursorPositionEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter<Action, OpenMediaFileSuccess>(
      (action): action is OpenMediaFileSuccess =>
        action.type === 'openFileSuccess' &&
        action.validatedFile.type === 'MediaFile'
    ),
    switchMap<OpenMediaFileSuccess, Observable<Action>>(() =>
      fromEvent<Event>(
        document,
        'timeupdate',
        // @ts-ignore
        true
      ).pipe(
        mergeMap(() => {
          const state = state$.value
          const newlyUpdatedTime = effects.getCurrentTime()
          const newMilliseconds = newlyUpdatedTime * 1000
          const newX = r.getXAtMilliseconds(state, newMilliseconds)

          const pendingMousedownItem = { temp: 'TEMP ' }

          const selection = r.getWaveformSelection(state)
          const possibleNewSelection = r.getNewWaveformSelectionAt(state, newX)
          const newSelection =
            selection &&
            selection.type === 'Clip' &&
            possibleNewSelection &&
            possibleNewSelection.type === 'Preview'
              ? overlapsSignificantly(
                  possibleNewSelection.item,
                  selection.item.start,
                  selection.item.end,
                  r.getHalfSecond(state$.value)
                )
                ? null
                : possibleNewSelection
              : possibleNewSelection

          const wasSeeking = seeking
          seeking = false

          const loopImminent =
            !wasSeeking &&
            r.getLoopState(state) &&
            effects.isMediaPlaying() &&
            selection &&
            newlyUpdatedTime >= r.getSecondsAtX(state, selection.item.end)
          if (loopImminent && selection && selection.item) {
            const selectionStartTime = r.getSecondsAtX(
              state,
              selection.item.start
            )
            effects.setCurrentTime(selectionStartTime)
            return of(actions.setCursorPosition(selection.item.start))
          }

          const setViewboxAction = setViewBox(
            state,
            newlyUpdatedTime,
            effects.getWaveformSvgWidth(),
            newSelection,
            wasSeeking,
            { temp: 'TEMP ' }
          )

          if (newSelection && !areSelectionsEqual(selection, newSelection)) {
            return from([
              ...setViewboxAction,
              r.selectWaveformItem(newSelection),
            ])
          }

          if (!newSelection && wasSeeking) {
            return from([...setViewboxAction, r.clearWaveformSelection()])
          }

          return from(setViewboxAction)
        }),
        startWith(actions.setCursorPosition(0, { xMin: 0 }))
      )
    )
  )

const setViewBox = (
  state: AppState,
  newlySetTime: number,
  svgWidth: number,
  newSelection: ReturnType<typeof r.getNewWaveformSelectionAt>,
  seeking: boolean,
  pendingMousedownItem: { temp: 'TEMP ' }
) => {
  const viewBox = state.waveform.viewBox

  const newX = Math.round(newlySetTime * 50)

  const buffer = Math.round(svgWidth * 0.1)

  if (newX < viewBox.xMin) {
    return [
      actions.setCursorPosition(
        newX,
        pendingMousedownItem
          ? undefined
          : {
              ...viewBox,
              xMin: Math.max(0, newX - buffer),
            }
      ),
    ]
  }
  if (newX >= svgWidth + viewBox.xMin) {
    const xMin = Math.min(
      newSelection ? newSelection.item.end + buffer : newX,
      Math.max(state.waveform.length - svgWidth, 0)
    )
    return [
      actions.setCursorPosition(
        newX,
        pendingMousedownItem ? undefined : { ...viewBox, xMin }
      ),
    ]
  }
  return seeking ? [actions.setCursorPosition(newX)] : []
}

type OpenMediaFileSuccess = {
  type: 'openFileSuccess'
  filePath: string
  validatedFile: MediaFile
  timestamp: string
}

const seekingTrackerEpic: AppEpic = (action$) =>
  action$.pipe(
    filter<Action, OpenMediaFileSuccess>(
      (action): action is OpenMediaFileSuccess =>
        action.type === 'openFileSuccess' &&
        action.validatedFile.type === 'MediaFile'
    ),
    switchMap<OpenMediaFileSuccess, Observable<Action>>(() =>
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

export default combineEpics(setCursorPositionEpic, seekingTrackerEpic)
