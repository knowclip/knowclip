import { ignoreElements, map, switchMap, tap } from 'rxjs/operators'
import { of } from 'rxjs'
import r from '../redux'
import A from '../types/ActionType'
import { ActionOf } from '../actions'
import { combineEpics } from 'redux-observable'
import { RecalculateWaveformRegionsEvent } from '../components/Main'
import { afterUpdates } from '../utils/afterUpdates'
import { ClipwaveRegionsUpdateEvent } from 'clipwave'

const clipCreateEpic: AppEpic = (
  action$,
  state$,
) => {
  return action$
    .ofType<ActionOf<typeof A.addClipRequest>>(A.addClipRequest)
    .pipe(
      switchMap(({ waveformDrag, clipId }) => {
        const left = Math.min(waveformDrag.start, waveformDrag.end)
        const right = Math.max(waveformDrag.start, waveformDrag.end)

        const currentFileId = r.getCurrentFileId(state$.value)
        if (!currentFileId) throw new Error('Could not find current note type')

        const coordinates = {
          start: left,
          end: right,
        }
        // TODO: get linked subtitles from waveformDrag.overlaps
        const fields = r.getNewFieldsFromLinkedSubtitles(
          state$.value,
          coordinates
        )
        const { clip, flashcard } = r.getNewClipAndCard(
          state$.value,
          coordinates,
          currentFileId,
          clipId,
          fields
        )

        return of(
          r.addClip(
            clip,
            flashcard,
            !Object.values(fields).some((fieldValue) => fieldValue.trim())
          )
        )
      })
    )
}

// maybe instead of manually calling waveform actions alongside Knowclip addClip, stretchClip, etc. in waveform event handlers,
// listen to all those knowclip actions ike this
// and dispatch a WaveformRegionsUpdateEvent which takes a callback, (waveform: WaveformInterface) => void.
// in the callback, do the updates.
const recalculateWaveformRegionsEpic: AppEpic = (
  action$,
  state$,
  { document, window }
) => {
  return action$
    .ofType<ActionOf<typeof A.addClip | typeof A.addClips>>(
      A.addClip,
      A.addClips
    )
    .pipe(
      tap(() => {
        console.log('dispatching recalculate event!')
        window.setTimeout(
          () => document.dispatchEvent(new RecalculateWaveformRegionsEvent()),
          0
        )
      }),
      ignoreElements()
    )
}

export default combineEpics(clipCreateEpic)
