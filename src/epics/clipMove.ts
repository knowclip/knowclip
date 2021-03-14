import { switchMap, filter, withLatestFrom } from 'rxjs/operators'
import { EMPTY, from, fromEvent } from 'rxjs'
import r from '../redux'
import WaveformMousedownEvent, {
  WaveformDragEvent,
  WaveformDragMove,
} from '../utils/WaveformMousedownEvent'
import { msToSeconds } from '../selectors'

const MOVE_START_DELAY = 400

const clipMoveEpic: AppEpic = (
  action$,
  state$,
  { document, setCurrentTime }
) => {
  return fromEvent<WaveformDragEvent>(document, 'waveformDrag').pipe(
    filter(
      (e): e is WaveformDragEvent & { action: WaveformDragMove } =>
        e.action.type === 'MOVE'
    ),
    withLatestFrom(
      fromEvent<WaveformMousedownEvent>(document, 'waveformMousedown')
    ),
    switchMap(
      ([
        { action: move, timeStamp: dragTimestamp },
        { timeStamp: mousedownTimestamp },
      ]) => {
        if (dragTimestamp - mousedownTimestamp < MOVE_START_DELAY) return EMPTY

        const deltaX = move.start - move.end

        const newStart = move.clipToMove.start - deltaX
        const newEnd = move.clipToMove.end - deltaX

        const overlaps = r
          .getCurrentFileClips(state$.value)
          .filter(({ id, start, end }) => {
            return (
              id !== move.clipToMove.id && start <= newEnd && end >= newStart
            )
          })
        const overlapIds = overlaps.map((c) => c.id)

        setCurrentTime(
          msToSeconds(Math.min(newStart, ...overlaps.map((c) => c.start)))
        )
        return from([r.moveClip(move.clipToMove.id, deltaX, overlapIds)])
      }
    )
  )
}

export default clipMoveEpic
