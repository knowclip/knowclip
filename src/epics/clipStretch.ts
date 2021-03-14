import { filter, tap, mergeMap } from 'rxjs/operators'
import { from, fromEvent } from 'rxjs'
import r from '../redux'
import {
  WaveformDragEvent,
  WaveformDragStretch,
} from '../utils/WaveformMousedownEvent'
import { msToSeconds } from '../selectors'

const clipStretchEpic: AppEpic = (
  action$,
  state$,
  { setCurrentTime, document }
) => {
  return fromEvent<WaveformDragEvent>(document, 'waveformDrag').pipe(
    filter(
      (e): e is WaveformDragEvent & { action: WaveformDragStretch } =>
        e.action.type === 'STRETCH'
    ),
    mergeMap(({ action }) => {
      const {
        start,
        end: dragEnd,
        clipToStretch: { id },
      } = action
      const stretchedClip = r.getClip(state$.value, id)
      if (!stretchedClip)
        throw new Error('Illegal state: clip being stretched is gone')


      const originKey =
        Math.abs(start - stretchedClip.start) <
        Math.abs(start - stretchedClip.end)
          ? 'start'
          : 'end'

          const end = stretchedClip[originKey] + (dragEnd - start)


      const waveformItems = r.getWaveformItems(state$.value)
      const stretchedClipItem =
        stretchedClip &&
        waveformItems.find(
          (item) => item.type === 'Clip' && item.id === stretchedClip.id
        )
      // if pendingStretch.end is inside a clip separate from stretchedClip,
      // take the start from the earlier and the end from the later,
      // use those as the new start/end of stretchedClip,
      // and delete the separate clip.
      const previousClipId = r.getPreviousClipId(state$.value, id)
      const previousClip =
        previousClipId && r.getClip(state$.value, previousClipId)
      if (previousClip && previousClipId && end <= previousClip.end) {
        setCurrentTime(msToSeconds(previousClip.start))

        return from([
          ...(stretchedClipItem?.type === 'Clip'
            ? [
                r.mergeClips([id, previousClipId], {
                  type: 'Clip',
                  id: stretchedClipItem.id,
                  index: stretchedClipItem.index,
                }),
              ]
            : []),
        ])
      }

      const nextClipId = r.getNextClipId(state$.value, id)
      const nextClip = nextClipId && r.getClip(state$.value, nextClipId)
      if (nextClip && nextClipId && end >= nextClip.start) {
        if (stretchedClip) setCurrentTime(stretchedClip.start / 1000)

        return from([
          ...(stretchedClipItem?.type === 'Clip'
            ? [
                r.mergeClips([id, nextClipId], {
                  type: 'Clip',
                  id: stretchedClipItem.id,
                  index: stretchedClipItem.index,
                }),
              ]
            : []),
        ])
      }

      if (originKey === 'start' && stretchedClip && stretchedClip.end > end) {
        const start = Math.min(end, stretchedClip.end - r.CLIP_THRESHOLD_MILLSECONDS)

        const newCard = r.getNewFlashcardForStretchedClip(
          state$.value,
          action.viewState,
          r.getCurrentNoteType(state$.value) as NoteType,
          stretchedClip,
          r.getFlashcard(state$.value, stretchedClip.id) as Flashcard,
          { start, end: stretchedClip.end },
          'PREPEND'
        )
        setCurrentTime(start / 1000)
        return from([
          r.editClip(
            id,
            {
              start,
            },
            newCard !==
              (r.getFlashcard(state$.value, stretchedClip.id) as Flashcard)
              ? newCard
              : null
          ),
        ])
      }

      if (originKey === 'end' && stretchedClip && end > stretchedClip.start) {
        const newCard = r.getNewFlashcardForStretchedClip(
          state$.value,
          action.viewState,
          r.getCurrentNoteType(state$.value) as NoteType,
          stretchedClip,
          r.getFlashcard(state$.value, stretchedClip.id) as Flashcard,
          { end, start: stretchedClip.start },
          'APPEND'
        )

        return from([
          r.editClip(
            id,
            {
              end: Math.max(end, stretchedClip.start + r.CLIP_THRESHOLD_MILLSECONDS),
            },
            newCard !==
              (r.getFlashcard(state$.value, stretchedClip.id) as Flashcard)
              ? newCard
              : null
          ),
        ])
      }

      return from([])
    })
  )
}

export default clipStretchEpic
