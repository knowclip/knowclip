import React, { useCallback, useEffect } from 'react'
import {
  useWaveform,
  WaveformGestureOf,
  ClipDrag,
  msToSeconds,
  WaveformDrag,
  CLIP_THRESHOLD_MILLSECONDS,
  ClipStretch,
  recalculateRegions,
  PrimaryClip,
  WaveformRegion,
} from 'clipwave'
import { actions } from '../actions'
import { bound } from '../utils/bound'
import { uuid } from '../utils/sideEffects'
import { setCurrentTime } from '../utils/media'
import { Dispatch } from 'redux'
import { KEYS } from '../utils/keyboard'
import { isTextFieldFocused } from '../utils/isTextFieldFocused'
import {
  getSubtitlesCardBases,
  overlapsSignificantly,
  SubtitlesCardBase,
} from '../selectors'
import { useSelector } from 'react-redux'
console.log('update went throo')

export function useWaveformEventHandlers({
  playerRef,
  dispatch,
  waveform,
  highlightedClipId,
  selectPrevious,
  selectNext,
}: {
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>
  dispatch: Dispatch<Action>
  waveform: ReturnType<typeof useWaveform>
  highlightedClipId: string | null
  selectPrevious: () => void
  selectNext: () => void
}) {
  const {
    getItemDangerously,
    actions: waveformActions,
    state: { regions },
  } = waveform
  const handleWaveformDrag = useCallback(
    ({ gesture }: WaveformGestureOf<WaveformDrag>) => {
      console.log('handleWaveformDrag!')
      const { start: startRaw, end: endRaw, overlaps } = gesture
      const left = Math.min(startRaw, endRaw)
      const right = Math.max(startRaw, endRaw)

      const tooSmallOrClipOverlapsExist =
        right - left < CLIP_THRESHOLD_MILLSECONDS ||
        overlaps.some((id) => getItemDangerously(id).clipwaveType === 'Primary')
      console.log(
        {
          tooSmallOrClipOverlapsExist,
          left,
          right,
          CLIP_THRESHOLD_MILLSECONDS,
        },
        overlaps.map((id) => getItemDangerously(id))
      )
      if (tooSmallOrClipOverlapsExist) {
        if (playerRef.current) {
          playerRef.current.currentTime = msToSeconds(endRaw)
        }
        return
      }

      const newId = uuid()

      console.log('dispatching adcliprequest')
      dispatch(actions.addClipRequest(gesture, newId))

      if (playerRef.current) {
        playerRef.current.currentTime = msToSeconds(left)
      }
    },
    [dispatch, getItemDangerously, playerRef]
  )

  const MOVE_START_DELAY = 400
  const handleClipDrag = useCallback(
    ({ gesture: move, mouseDown, timeStamp }: WaveformGestureOf<ClipDrag>) => {
      const moveImminent = timeStamp - mouseDown.timeStamp >= MOVE_START_DELAY
      if (moveImminent) {
        const deltaX = move.end - move.start

        const clipToMove = getItemDangerously(move.clipId)

        const offsetStart = clipToMove.start + deltaX
        const offsetEnd = clipToMove.end + deltaX

        const clipToMoveId = clipToMove.id
        console.log('overlaps', move.overlaps)

        const overlaps = move.overlaps.flatMap((id) => {
          const item = getItemDangerously(id)
          const { start, end } = item
          return item.clipwaveType === 'Primary' &&
            start <= offsetEnd &&
            end >= offsetStart
            ? [item]
            : []
        })
        console.log(
          { overlaps },
          move.overlaps.map((ol) => getItemDangerously(ol))
        )
        const overlapIds = overlaps.map((c) => c.id)

        setCurrentTime(
          msToSeconds(Math.min(offsetStart, ...overlaps.map((c) => c.start)))
        )

        const toMerge = [
          { id: clipToMoveId, start: offsetStart, end: offsetEnd },
          ...overlaps,
        ].sort((a, b) => a.start - b.start)

        const newStartWithMerges = Math.min(...toMerge.map((c) => c.start))
        const newEndWithMerges = Math.max(...toMerge.map((c) => c.end))

        const newRegions = recalculateRegions(regions, getItemDangerously, [
          {
            id: clipToMoveId,
            newItem: {
              ...getItemDangerously(clipToMoveId),
              id: clipToMoveId,
              start: newStartWithMerges,
              end: newEndWithMerges,
            },
          },
          ...overlapIds.map((id) => ({ id, newItem: null })),
        ])
        console.log('newRegions', newRegions)

        waveform.dispatch({
          type: 'SET_REGIONS',
          regions: newRegions,
        })
        dispatch(actions.moveClip(clipToMoveId, deltaX, overlapIds, newRegions))

        return
      }

      const { regionIndex, start, end } = move
      const deltaX = end - start
      const { clipId } = move

      const clipToDrag = getItemDangerously(clipId)
      const isHighlighted = clipToDrag.id === highlightedClipId

      const draggedClipStart = moveImminent
        ? clipToDrag.start + deltaX
        : clipToDrag.start
      const newTimeSeconds =
        !isHighlighted || moveImminent
          ? bound(msToSeconds(draggedClipStart), [
              0,
              waveform.state.durationSeconds,
            ])
          : msToSeconds(end)
      // waveformActions.selectItemAndSeekTo(
      //   regionIndex,
      //   clipId,
      //   playerRef.current,
      //   newTimeSeconds
      // )
      if (playerRef.current) {
        playerRef.current.currentTime = newTimeSeconds
      }
    },
    [getItemDangerously, highlightedClipId, waveform, playerRef, regions, dispatch]
  )

  const cardsBases = useSelector(getSubtitlesCardBases)

  // TODO: set time after stretch
  const STRETCH_START_DELAY = 100
  const handleClipEdgeDrag = useCallback(
    ({
      gesture: stretch,
      mouseDown,
      timeStamp,
    }: WaveformGestureOf<ClipStretch>) => {
      console.log('hihihi')
      if (timeStamp - mouseDown.timeStamp > STRETCH_START_DELAY) {
        const unstretchedClip = getItemDangerously(stretch.clipId)
        const stretchedClip = {
          ...unstretchedClip,
          [stretch.originKey]: stretch.end,
        }

        const {
          overlaps,
          newlyOverlappedFront,
          newlyOverlappedBack,
        } = stretch.overlaps.reduce(
          (acc, id) => {
            const item = getItemDangerously(id)
            const { start, end } = item
            const overlap =
              start <= stretchedClip.end && end >= stretchedClip.start
            if (overlap && item.clipwaveType === 'Primary') {
              acc.overlaps.push(item)
            }
            if (overlap && item.clipwaveType === 'Secondary') {
              const newlyOverlapped =
                overlapsSignificantly(stretchedClip, item.start, item.end) &&
                !overlapsSignificantly(unstretchedClip, item.start, item.end)
              if (newlyOverlapped) {
                const side =
                  item.start < stretchedClip.start
                    ? acc.newlyOverlappedFront
                    : acc.newlyOverlappedBack
                const cardBase = cardsBases.cardsMap[item.id]
                if (cardBase) side.push(cardBase)
              }
            }
            return acc
          },
          {
            overlaps: [],
            newlyOverlappedFront: [],
            newlyOverlappedBack: [],
          } as {
            overlaps: PrimaryClip[]
            newlyOverlappedFront: SubtitlesCardBase[]
            newlyOverlappedBack: SubtitlesCardBase[]
          }
        )
        console.log(
          { overlaps },
          stretch.overlaps.map((ol) => getItemDangerously(ol))
        )
        const overlapIds = overlaps.map((c) => c.id)

        const newStartWithMerges = Math.min(
          ...[stretchedClip, ...overlaps].map((i) => i.start)
        )
        const newEndWithMerges = Math.max(
          ...[stretchedClip, ...overlaps].map((i) => i.end)
        )

        // change regions
        // stretch in knowclip
        const clipToStretchId = stretch.clipId
        // TODO: inside recalculateRegions, return region info for updated items in params
        const newItem = {
          ...getItemDangerously(clipToStretchId),
          id: clipToStretchId,
          start: newStartWithMerges,
          end: newEndWithMerges,
        }
        const newRegions = recalculateRegions(regions, getItemDangerously, [
          {
            id: clipToStretchId,
            newItem,
          },
          ...overlapIds.map((id) => ({ id, newItem: null })),
        ])
        console.log('stretchiboo')
        const newSelection = {
          item: clipToStretchId,
          regionIndex: newRegions.findIndex(
            (region, i) =>
              region.start >= newStartWithMerges &&
              getRegionEnd(newRegions, i) < newEndWithMerges
          ),
        }
        waveform.dispatch({
          type: 'SET_REGIONS',
          regions: newRegions,
          newSelection,
          // // TODO: optimize via guarantee that new selection item is stretchedClip
          // newSelection: getNewWaveformSelectionAt(
          //   getItemDangerously,
          //   newRegions,
          //   secondsToMs(stretchedClip.start),
          //   waveform.state.selection
          // )
        })

        dispatch(
          actions.stretchClip(
            stretchedClip,
            overlaps,
            newlyOverlappedFront,
            newlyOverlappedBack,
            newRegions
          )
        )

        // waveform.actions.selectItemAndSeekTo(
        //   newSelection.regionIndex,
        //   newSelection.item,
        //   playerRef.current,
        //   msToSeconds(stretchedClip.start)
        // )
        if (playerRef.current) {
          playerRef.current.currentTime =  msToSeconds(newItem.start)
        }
      } else {
      }
    },
    [cardsBases.cardsMap, dispatch, getItemDangerously, playerRef, regions, waveform]
  )
  console.log({ regions })
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const { altKey, key } = event
      if (key === KEYS.arrowRight && (altKey || !isTextFieldFocused())) {
        return selectNext()
      }

      if (key === KEYS.arrowLeft && (altKey || !isTextFieldFocused())) {
        return selectPrevious()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  })

  return { handleWaveformDrag, handleClipDrag, handleClipEdgeDrag }
}

export function getRegionEnd(regions: WaveformRegion[], index: number): number {
  const end = regions[regions.length - 1].end
  if (typeof end !== 'number') throw new Error('No regions end found')
  const nextRegion: WaveformRegion | null = regions[index + 1] || null
  if (!nextRegion) return end
  const nextRegionStart = nextRegion.start
  return nextRegionStart
}
