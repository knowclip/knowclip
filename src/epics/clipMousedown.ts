import {
  map,
  switchMap,
  takeUntil,
  takeLast,
  sample,
  take,
  mergeMap,
  skipUntil,
  distinctUntilChanged,
  tap,
} from 'rxjs/operators'
import { fromEvent, from, of, merge, timer, EMPTY } from 'rxjs'
import r from '../redux'
import {
  toWaveformCoordinates,
  toWaveformX,
} from '../utils/waveformCoordinates'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'
import uuid from 'uuid'

const clipMousedownEpic: AppEpic = (action$, state$, deps) => {
  const clipMousedowns = fromEvent<WaveformMousedownEvent>(
    deps.document,
    'waveformMousedown'
  ).pipe(
    switchMap(({ svg, milliseconds, browserMousedown }) => {
      const x = r.getXAtMilliseconds(state$.value, milliseconds)
      const edge = r.getClipEdgeAt(state$.value, x)
      if (edge)
        return of({ action: 'STRETCH' as const, mousedownSpecs: { x, edge } })

      const svgElement = deps.getWaveformSvgElement()
      if (!svgElement) throw new Error('Waveform disappeared')

      const coords = toWaveformCoordinates(
        browserMousedown,
        svgElement,
        state$.value.waveform.viewBox.xMin
      )

      const clipHitId = r.getClipIdAt(state$.value, x)
      if (clipHitId) {
        const clipHit = r.getClip(state$.value, clipHitId)
        if (!clipHit)
          throw new Error(`Illegal state: clip "${clipHitId}" not found`)

        return of({
          action: 'MOVE' as const,
          mousedownSpecs: { x, coords, clipHit, svg },
        })
      }

      return of({
        action: 'CREATE' as const,
        mousedownSpecs: { x, coords, milliseconds, svg: svgElement },
      })
    }),
    switchMap((trigger) => {
      switch (trigger.action) {
        case 'CREATE':
          return createClip(trigger.mousedownSpecs)(action$, state$, deps)
        case 'MOVE':
          return moveClip(trigger.mousedownSpecs)(action$, state$, deps)
        case 'STRETCH':
          return stretchClip(trigger.mousedownSpecs)(action$, state$, deps)
      }
    })
  )
  return clipMousedowns
}

function createClip({
  milliseconds,
  svg,
}: {
  x: number
  milliseconds: number
  coords: { x: number; y: number }
  svg: SVGElement
}): AppEpic {
  return (action$, state$, { window, setCurrentTime }) => {
    const mediaFile = r.getCurrentMediaFile(state$.value)
    if (!mediaFile) throw new Error('No current media metadata')
    // this should be used also in stretch epic, i guess at any reference to waveform x
    const factor =
      state$.value.waveform.stepsPerSecond * state$.value.waveform.stepLength
    const withinValidTime = (x: number) =>
      Math.max(0, Math.min(x, mediaFile.durationSeconds * factor))

    const mousemoves = fromEvent<MouseEvent>(window, 'mousemove')
    const mouseups = fromEvent(window, 'mouseup').pipe(take(1))

    const pendingClips = mousemoves.pipe(
      map((mousemove) => {
        mousemove.preventDefault()
        return r.setPendingClip({
          start: withinValidTime(
            r.getXAtMilliseconds(state$.value, milliseconds)
          ), // should start be called origin instead to match with stretch thing?
          end: withinValidTime(
            toWaveformX(mousemove, svg, r.getWaveformViewBoxXMin(state$.value))
          ),
        })
      }),
      takeUntil(mouseups)
    )

    const pendingClipEnds = pendingClips.pipe(
      takeLast(1),
      mergeMap((pendingClipAction) => {
        const { action: pendingClip } = pendingClipAction
        const clipsOrder = r.getCurrentFileClipsOrder(state$.value)
        const pendingClipOverlaps = [
          r.getClipIdAt(state$.value, pendingClip.start),
          r.getClipIdAt(state$.value, pendingClip.end),
        ].some((id) => id && clipsOrder.includes(id))
        const currentFileId = r.getCurrentFileId(state$.value)
        if (!currentFileId) throw new Error('Could not find current note type')

        const tooSmall =
          pendingClipOverlaps || !pendingClipIsBigEnough(state$.value)

        const left = Math.min(pendingClip.start, pendingClip.end)
        const right = Math.max(pendingClip.start, pendingClip.end)

        const newTime = r.getSecondsAtX(state$.value, tooSmall ? right : left)
        if (!tooSmall) setCurrentTime(newTime)

        // maybe later, do stretch + merge for overlaps.
        if (tooSmall) return of(r.clearPendingWaveformAction())

        const fields = r.getNewFieldsFromLinkedSubtitles(state$.value, {
          start: left,
          end: right,
        })
        const { clip, flashcard } = r.getNewClipAndCard(
          state$.value,
          pendingClip,
          currentFileId,
          uuid(),
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

    return merge(pendingClips, pendingClipEnds)
  }
}
function moveClip({
  clipHit,
  coords: mousedownCoords,
}: {
  x: number
  clipHit: Clip
  coords: { x: number; y: number }
  svg: SVGElement
}): AppEpic {
  return (action$, state$, { window, getWaveformSvgElement }) => {
    const mousemoves = fromEvent<MouseEvent>(window, 'mousemove').pipe(
      tap(mousemove => {
        mousemove.preventDefault()
      }),
      takeUntil(fromEvent(window, 'mouseup'))
    )

    const wait = timer(400).pipe(take(1))
    const delayedMousemoves = merge(
      mousemoves.pipe(sample(wait)),
      mousemoves.pipe(skipUntil(wait))
    )
    const pendingMoves = delayedMousemoves.pipe(
      map((mousemove) => {
        const svgElement = getWaveformSvgElement()
        if (!svgElement) throw new Error('Waveform disappeared')

        const mousemoveCoords = toWaveformCoordinates(
          mousemove,
          svgElement,
          state$.value.waveform.viewBox.xMin
        )
        const deltaX = mousedownCoords.x - mousemoveCoords.x
        return r.setPendingMove({
          start: clipHit.start - deltaX,
          end: clipHit.end - deltaX,
          deltaX,
        })
      }),
      distinctUntilChanged(({ action: { deltaX: a } }, { action: { deltaX: b } }) => a === b)
    )

    return merge(
      pendingMoves,
      pendingMoves.pipe(
        takeLast(1),
        switchMap((lastPendingMove) => {
          const { action: move } = lastPendingMove
          const overlapIds = r
            .getCurrentFileClips(state$.value)
            .filter(({ id, start, end }) => {
              return id !== clipHit.id && start <= move.end && end >= move.start
            })
            .map((c) => c.id)

          return from([
            r.moveClip(clipHit.id, move.deltaX, overlapIds),
            r.clearPendingWaveformAction(),
          ])
        })
      )
    )
  }
}

function stretchClip(mousedownSpecs: {
  x: number
  edge: { key: 'start' | 'end'; id: string }
}): AppEpic {
  return (
    action$,
    state$,
    { window, getWaveformSvgElement, setCurrentTime }
  ) => {
    const {
      edge: { key, id },
    } = mousedownSpecs
    const pendingStretches = fromEvent<MouseEvent>(window, 'mousemove').pipe(
      takeUntil(fromEvent(window, 'mouseup')),
      map((mousemove) => {
        const svgElement = getWaveformSvgElement()
        if (!svgElement) throw new Error('Waveform disappeared')
        return r.setPendingStretch({
          id,
          originKey: key,
          end: toWaveformX(
            mousemove,
            svgElement,
            r.getWaveformViewBoxXMin(state$.value)
          ),
        })
      })
    )

    return merge(
      pendingStretches,
      pendingStretches.pipe(
        takeLast(1),
        switchMap((lastPendingStretch) => {
          const {
            action: { id, originKey, end },
          } = lastPendingStretch
          const stretchedClip = r.getClip(state$.value, id)

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
            setCurrentTime(r.getSecondsAtX(state$.value, previousClip.start))

            return from([
              r.clearPendingWaveformAction(),
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
            if (stretchedClip)
              setCurrentTime(r.getSecondsAtX(state$.value, stretchedClip.start))

            return from([
              r.clearPendingWaveformAction(),
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

          if (
            originKey === 'start' &&
            stretchedClip &&
            stretchedClip.end > end
          ) {
            const start = Math.min(end, stretchedClip.end - r.CLIP_THRESHOLD)

            const newCard = r.getNewFlashcardForStretchedClip(
              state$.value,
              r.getCurrentNoteType(state$.value) as NoteType,
              stretchedClip,
              r.getFlashcard(state$.value, stretchedClip.id) as Flashcard,
              { start, end: stretchedClip.end },
              'PREPEND'
            )
            setCurrentTime(r.getSecondsAtX(state$.value, start))
            return from([
              r.clearPendingWaveformAction(),
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

          if (
            originKey === 'end' &&
            stretchedClip &&
            end > stretchedClip.start
          ) {
            const newCard = r.getNewFlashcardForStretchedClip(
              state$.value,
              r.getCurrentNoteType(state$.value) as NoteType,
              stretchedClip,
              r.getFlashcard(state$.value, stretchedClip.id) as Flashcard,
              { end, start: stretchedClip.start },
              'APPEND'
            )

            return from([
              r.clearPendingWaveformAction(),
              r.editClip(
                id,
                {
                  end: Math.max(end, stretchedClip.start + r.CLIP_THRESHOLD),
                },
                newCard !==
                  (r.getFlashcard(state$.value, stretchedClip.id) as Flashcard)
                  ? newCard
                  : null
              ),
            ])
          }

          return from([r.clearPendingWaveformAction()])
        })
      )
    )
  }
}

function pendingClipIsBigEnough(state: AppState) {
  const pendingClip = r.getPendingClip(state)
  if (!pendingClip) return false

  const { start, end } = pendingClip
  return Math.abs(end - start) >= r.CLIP_THRESHOLD
}

export default clipMousedownEpic
