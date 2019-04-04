import { map, flatMap, takeWhile } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { setWaveformCursor } from '../actions'
import * as r from '../redux'

const elementWidth = element => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

const audioElement = () => document.getElementById('audioPlayer')

const setWaveformCursorEpic = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_SUCCESS'),
    flatMap(() =>
      fromEvent(audioElement(), 'timeupdate').pipe(
        // takeUntil(
        // merge(
        //   action$.pipe(
        //     ofType('CLOSE_PROJECT', 'OPEN_MEDIA_FILE_REQUEST' /* CLOSE_MEDIA_FILE */),
        //   ),
        //   action$.pipe(
        //     ofType('DELETE_MEDIA_FROM_PROJECT'),
        //     withLatestFrom('OPEN_MEDIA_FILE_SUCCESS'),
        //     filter(([deleteMedia, openMediaFileSuccess]) => deleteMedia.mediaFileId === openMediaFileSuccess.id)
        //   )
        // ),
        // ),
        takeWhile(() => r.getConstantBitrateFilePath(state$.value)),
        map(e => {
          const viewBox = state$.value.waveform.viewBox

          const highlightedId = r.getHighlightedClipId(state$.value)
          const highlightedClip =
            highlightedId && r.getClip(state$.value, highlightedId)
          const timeToLoop =
            highlightedClip &&
            r.isLoopOn(state$.value) &&
            e.target.currentTime >=
              r.getSecondsAtX(state$.value, highlightedClip.end)
          if (timeToLoop) {
            e.target.currentTime = r.getSecondsAtX(
              state$.value,
              highlightedClip.start
            )
          }

          const newX = Math.round(
            timeToLoop
              ? highlightedClip.start
              : e.target.currentTime && e.target.currentTime * 50
          )
          const svgElement = document.getElementById('waveform-svg')
          // if (!svgElement) return { type: 'WHOOPS CaNT UPDATE CURSOR NOW' }
          const svgWidth = elementWidth(svgElement)
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
        })
      )
    )
  )

export default setWaveformCursorEpic
