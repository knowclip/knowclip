import React, { useCallback, useEffect } from 'react'
import {
  WaveformGestureOf,
  ClipDrag,
  msToSeconds,
  WaveformDrag,
  CLIP_THRESHOLD_MILLSECONDS,
  ClipStretch,
  recalculateRegions,
  PrimaryClip,
  WaveformRegion,
  secondsToMs,
  GetWaveformItemDangerously,
  WaveformItem,
  WaveformInterface,
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
  SubtitlesCardBase,
  SubtitlesCardBases,
} from '../selectors'
import { useSelector } from 'react-redux'

export function useWaveformEventHandlers({
  playerRef,
  dispatch,
  waveform,
  highlightedClipId,
}: {
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>
  dispatch: Dispatch<Action>
  waveform: WaveformInterface
  highlightedClipId: string | null
}) {
  const {
    getItemDangerously,
    actions: waveformActions,
    state: { regions, durationSeconds },
  } = waveform
  const handleWaveformDrag = useCallback(
    ({ gesture }: WaveformGestureOf<WaveformDrag>) => {
      const { start: startRaw, end: endRaw, overlaps } = gesture
      const left = Math.min(startRaw, endRaw)
      const right = Math.max(startRaw, endRaw)

      const tooSmallOrClipOverlapsExist =
        right - left < CLIP_THRESHOLD_MILLSECONDS ||
        overlaps.some((id) => getItemDangerously(id).clipwaveType === 'Primary')
      if (tooSmallOrClipOverlapsExist) {
        if (playerRef.current) {
          playerRef.current.currentTime = msToSeconds(endRaw)
        }
        return
      }

      const newId = uuid()

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

        const overlaps = move.overlaps.flatMap((id) => {
          const item = getItemDangerously(id)
          const { start, end } = item
          return item.clipwaveType === 'Primary' &&
            start <= offsetEnd &&
            end >= offsetStart
            ? [item]
            : []
        })
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

        waveform.dispatch({
          type: 'SET_REGIONS',
          regions: newRegions,
          newSelection: {
            regionIndex: newRegions.findIndex(
              (r) =>
                r.start >= newStartWithMerges &&
                (r.end ?? secondsToMs(durationSeconds)) < newEndWithMerges
            ),
            item: clipToMoveId,
          },
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
      waveformActions.selectItemAndSeekTo(
        regionIndex,
        clipId,
        playerRef.current,
        secondsToMs(newTimeSeconds)
      )
    },
    [
      getItemDangerously,
      highlightedClipId,
      waveform,
      waveformActions,
      playerRef,
      regions,
      dispatch,
      durationSeconds,
    ]
  )

  const cardsBases = useSelector(getSubtitlesCardBases)

  const STRETCH_START_DELAY = 100
  const handleClipEdgeDrag = useCallback(
    ({
      gesture: stretch,
      mouseDown,
      timeStamp,
    }: WaveformGestureOf<ClipStretch>) => {
      const stretchImminent =
        timeStamp - mouseDown.timeStamp > STRETCH_START_DELAY
      if (!stretchImminent) return

      const unstretchedClip = getItemDangerously(stretch.clipId)
      const stretchedClip = {
        ...unstretchedClip,
        [stretch.originKey]: stretch.end,
      }

      const { clips, subtitlesFront, subtitlesBack } = getStretchedClipOverlaps(
        stretch,
        getItemDangerously,
        stretchedClip,
        cardsBases
      )

      const overlapIds = clips.map((c) => c.id)

      const newStartWithMerges = Math.min(
        ...[stretchedClip, ...clips].map((i) => i.start)
      )
      const newEndWithMerges = Math.max(
        ...[stretchedClip, ...clips].map((i) => i.end)
      )

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
      const newSelection = {
        item: clipToStretchId,
        regionIndex: newRegions.findIndex(
          (region, i) =>
            // TODO: optimize via guarantee that new selection item is stretchedClip
            region.start >= newStartWithMerges &&
            getRegionEnd(newRegions, i) < newEndWithMerges
        ),
      }
      waveform.dispatch({
        type: 'SET_REGIONS',
        regions: newRegions,
        newSelection,
      })

      dispatch(
        actions.stretchClip(
          stretchedClip,
          clips,
          unstretchedClip,
          subtitlesFront,
          subtitlesBack,
          newRegions
        )
      )
      waveform.actions.selectItemAndSeekTo(
        newSelection.regionIndex,
        newSelection.item,
        playerRef.current,
        stretchedClip.start
      )
    },
    [cardsBases, dispatch, getItemDangerously, playerRef, regions, waveform]
  )
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const { altKey, key } = event
      if (key === KEYS.arrowRight && (altKey || !isTextFieldFocused())) {
        return waveform.actions.selectNextItemAndSeek(playerRef.current)
      }

      if (key === KEYS.arrowLeft && (altKey || !isTextFieldFocused())) {
        return waveform.actions.selectPreviousItemAndSeek(playerRef.current)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [
    playerRef,
    waveform.actions.selectPreviousItemAndSeek,
    waveform.actions.selectNextItemAndSeek,
    waveform.actions,
  ])

  return { handleWaveformDrag, handleClipDrag, handleClipEdgeDrag }
}

type StretchedClipOverlaps = {
  clips: PrimaryClip[]
  subtitlesFront: SubtitlesCardBase[]
  subtitlesBack: SubtitlesCardBase[]
}
function getStretchedClipOverlaps(
  stretch: ClipStretch,
  getItemDangerously: GetWaveformItemDangerously,
  stretchedClip: WaveformItem,
  cardsBases: SubtitlesCardBases
): StretchedClipOverlaps {
  return stretch.overlaps.reduce(
    (acc: StretchedClipOverlaps, id) => {
      const item = getItemDangerously(id)
      const { start, end } = item
      const overlap = start <= stretchedClip.end && end >= stretchedClip.start
      if (!overlap) return acc

      if (item.clipwaveType === 'Primary') acc.clips.push(item)

      if (item.clipwaveType === 'Secondary') {
        const side =
          item.start < stretchedClip.start
            ? acc.subtitlesFront
            : acc.subtitlesBack
        const cardBase = cardsBases.cardsMap[item.id]
        if (cardBase) side.push(cardBase)
      }
      return acc
    },
    {
      clips: [],
      subtitlesFront: [],
      subtitlesBack: [],
    }
  )
}

export function getRegionEnd(regions: WaveformRegion[], index: number): number {
  const end = regions[regions.length - 1].end
  if (typeof end !== 'number') throw new Error('No regions end found')
  const nextRegion: WaveformRegion | null = regions[index + 1] || null
  if (!nextRegion) return end
  const nextRegionStart = nextRegion.start
  return nextRegionStart
}
