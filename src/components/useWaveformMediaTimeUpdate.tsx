import { useCallback, MutableRefObject, useEffect } from 'react'
import r from '../redux'
import {
  msToSeconds,
  overlapsSignificantly,
  pixelsToMs,
  secondsToMs,
  WaveformSelectionExpanded,
} from '../selectors'
import { useWaveformState, WaveformAction } from './useWaveformState'
import { usePrevious } from '../utils/usePrevious'
import { useDispatch, useSelector } from 'react-redux'
import { areSelectionsEqual } from '../utils/waveformSelection'
import { elementWidth } from '../utils/media'

export function useWaveformMediaTimeUpdate(
  svgRef: any,
  waveform: ReturnType<typeof useWaveformState>
) {
  const { dispatch: dispatchViewState, waveformItems } = waveform

  const { remoteSelection } = useSelector((state: AppState) => ({
    remoteSelection: r.getWaveformSelection(state),
  }))

  const dispatch = useDispatch()

  const previousRemoteSelection = usePrevious(remoteSelection)
  const previousLocalSelection = usePrevious(waveform.state.selection)
  useEffect(() => {
    const localChange = !areSelectionsEqual(
      waveform.state.selection,
      previousLocalSelection || null
    )
    const remoteChange = !areSelectionsEqual(
      remoteSelection,
      previousRemoteSelection || null
    )
    const notSyncedWithRemote = !areSelectionsEqual(
      remoteSelection,
      waveform.state.selection
    )

    if (localChange && notSyncedWithRemote) {
      dispatch(r.selectWaveformItem(waveform.state.selection))
    }
    if (remoteChange && notSyncedWithRemote) {
      if (remoteSelection)
        dispatchViewState({
          type: 'SET_CURSOR_POSITION',
          newSelection: remoteSelection,
          ms: remoteSelection.item.start,
        })
      else console.error('REMOTE DESELECTION')
    }
  }, [
    dispatch,
    dispatchViewState,
    previousLocalSelection,
    previousRemoteSelection,
    remoteSelection,
    waveform.state.selection,
  ])

  const onTimeUpdate = useCallback(
    (
      media: HTMLVideoElement | HTMLAudioElement,
      seeking: MutableRefObject<boolean>,
      looping: boolean
    ) => {
      const svg = svgRef.current
      if (!svg) return console.error('Svg disappeared')

      const newMilliseconds = secondsToMs(media.currentTime)

      const possibleNewSelection = r.getNewWaveformSelectionAtFromSubset(
        remoteSelection,
        waveform.waveformItems,
        newMilliseconds
      )

      const newSelection = getNewSelection(
        remoteSelection,
        possibleNewSelection
      )
      const wasSeeking = seeking.current
      seeking.current = false

      const selection = waveform.state.selection
      // tODO: optimize
      const selectionItem = waveformItems.find(
        (item) => item.index === selection?.index
      )?.item
      const loopImminent =
        !wasSeeking &&
        looping &&
        !media.paused &&
        selection &&
        selectionItem &&
        newMilliseconds >= selectionItem.end
      if (loopImminent && selection && selectionItem) {
        media.currentTime = msToSeconds(selectionItem.start)
        return dispatchViewState({
          type: 'SET_CURSOR_POSITION',
          ms: selectionItem.start,
          newViewBoxStartMs: undefined,
        })
      }

      const waveformupdate = updateWaveformAfterTimeUpdateEvent(
        waveform.state,
        newMilliseconds,
        svg,
        newSelection,
        wasSeeking,
        remoteSelection
      )
      if (waveformupdate) dispatchViewState(waveformupdate)
    },
    [
      dispatchViewState,
      remoteSelection,
      svgRef,
      waveform.state,
      waveform.waveformItems,
      waveformItems,
    ]
  )

  return { onTimeUpdate }
}

function getNewSelection(
  remoteSelection: WaveformSelectionExpanded | null,
  possibleNewSelection: WaveformSelectionExpanded | null
) {
  if (
    remoteSelection &&
    remoteSelection.type === 'Clip' &&
    possibleNewSelection &&
    possibleNewSelection.type === 'Preview'
  ) {
    return overlapsSignificantly(
      possibleNewSelection.item,
      remoteSelection.item.start,
      remoteSelection.item.end
    )
      ? null
      : possibleNewSelection
  }

  return possibleNewSelection
}

function updateWaveformAfterTimeUpdateEvent(
  viewState: ViewState,
  updatedTime: number,
  svg: SVGSVGElement,
  newSelectionAtTime: WaveformSelectionExpanded | null,
  wasSeeking: boolean,
  remoteSelection: WaveformSelectionExpanded | null
): WaveformAction | null {
  const newViewBoxStartMs = viewBoxStartMsOnTimeUpdate(
    viewState,
    updatedTime,
    elementWidth(svg),
    newSelectionAtTime,
    wasSeeking
  )

  if (
    newSelectionAtTime &&
    !areSelectionsEqual(remoteSelection, newSelectionAtTime)
  ) {
    return {
      type: 'SET_CURSOR_POSITION',
      ms: updatedTime,
      newSelection: newSelectionAtTime,
      newViewBoxStartMs,
    }
  }

  if (!newSelectionAtTime && wasSeeking) {
    return newViewBoxStartMs !== null
      ? {
          type: 'SET_CURSOR_POSITION',
          ms: updatedTime,
          newSelection: newSelectionAtTime,
          newViewBoxStartMs,
        }
      : // : r.selectWaveformItem(null)
        null
  }

  return {
    type: 'SET_CURSOR_POSITION',
    ms: updatedTime,
    newSelection: newSelectionAtTime,
    newViewBoxStartMs,
  }
}

function viewBoxStartMsOnTimeUpdate(
  viewState: ViewState,
  newlySetMs: number,
  svgWidth: number,
  newSelection: ReturnType<typeof r.getNewWaveformSelectionAt>,
  seeking: boolean
): number {
  const visibleTimeSpan = pixelsToMs(svgWidth, viewState.pixelsPerSecond)
  const buffer = Math.round(visibleTimeSpan * 0.1)

  const { viewBoxStartMs, durationSeconds } = viewState
  const durationMs = secondsToMs(durationSeconds)

  const currentRightEdge = viewBoxStartMs + visibleTimeSpan

  const leftShiftRequired = newlySetMs < viewBoxStartMs
  if (leftShiftRequired) {
    return Math.max(0, newlySetMs - buffer)
  }

  const rightShiftRequired = newlySetMs >= currentRightEdge
  if (rightShiftRequired) {
    return bound(newSelection ? newSelection.item.end + buffer : newlySetMs, [
      0,
      durationMs - visibleTimeSpan,
    ])
  }

  if (seeking && newSelection) {
    if (newSelection.item.end + buffer >= currentRightEdge)
      return bound(newSelection.item.end + buffer - visibleTimeSpan, [
        0,
        durationMs - visibleTimeSpan,
      ])

    if (newSelection.item.start - buffer <= viewBoxStartMs)
      return Math.max(0, newSelection.item.start - buffer)
  }

  function bound(number: number, [min, max]: [number, number]) {
    return Math.max(min, Math.min(max, number))
  }

  return viewState.viewBoxStartMs
}
