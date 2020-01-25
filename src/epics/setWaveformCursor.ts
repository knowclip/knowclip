import { fromEvent, Observable, of, from } from 'rxjs'
import { startWith, filter, switchMap, map } from 'rxjs/operators'
import { setWaveformCursor } from '../actions'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'

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

type OpenMediaFileSuccess = {
  type: 'OPEN_FILE_SUCCESS'
  filePath: string
  validatedFile: MediaFile
}
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
        map(() => {
          const maxX = r.getXAtMilliseconds(
            state$.value,
            validatedFile.durationSeconds
          )
          const newCurrentTime = effects.getCurrentTime()
          const highlightedClipId = r.getHighlightedClipId(state$.value)
          const newClipIdToHighlight = r.getClipIdAt(
            state$.value,
            r.getXAtMilliseconds(state$.value, newCurrentTime * 1000)
          )

          if (
            newClipIdToHighlight &&
            newClipIdToHighlight !== highlightedClipId
          )
            return r.highlightClip(newClipIdToHighlight)

          return setCursor(state$.value, newCurrentTime, maxX, effects)
        }),
        startWith(setWaveformCursor(0, { xMin: 0 }))
      )
    )
  )

export default setWaveformCursorEpic
