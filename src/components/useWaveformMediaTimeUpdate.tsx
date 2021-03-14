import { useCallback, MutableRefObject, useEffect } from 'react'
import r from '../redux'
import {
  msToSeconds,
  overlapsSignificantly,
  pixelsToMs,
  secondsToMs,
  WaveformSelectionExpanded,
} from '../selectors'
import { useWaveformState } from './useWaveformState'
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
      console.log('            selecting remote')
      console.log({
        localChange,
        remoteChange,
        notSyncedWithRemote,
        remoteSelection,
        selection: waveform.state.selection,
      })
      dispatch(r.selectWaveformItem(waveform.state.selection))
    }
    if (remoteChange && notSyncedWithRemote) {
      console.log('            selecting local')
      console.log({
        localChange,
        remoteChange,
        notSyncedWithRemote,
        remoteSelection,
        selection: waveform.state.selection,
      })
      dispatchViewState(r.selectWaveformItem(remoteSelection))
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
      console.log(
        'NEW SELECTION?',
        newSelection,
        { remoteSelection, possibleNewSelection },
        'waveformitems',
        {
          waveformItems: waveform.waveformItems,
          match: waveform.waveformItems.find(
            (item) =>
              item.type === 'Clip' && item.id === (remoteSelection as any)?.id
          ),
        }
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
  newlyUpdatedMs: number,
  svg: SVGSVGElement,
  newSelection: WaveformSelectionExpanded | null,
  wasSeeking: boolean,
  selection: WaveformSelectionExpanded | null
) {
  const setViewboxAction = setViewBox(
    viewState,
    newlyUpdatedMs,
    elementWidth(svg),
    newSelection,
    wasSeeking
  )

  if (newSelection && !areSelectionsEqual(selection, newSelection)) {
    console.log(' ~~~ a')
    return setViewboxAction
      ? {
          ...setViewboxAction,
          newSelection,
        }
      : r.selectWaveformItem(newSelection)
  }

  if (!newSelection && wasSeeking) {
    console.log(' ~~~ b', { newSelection })
    return setViewboxAction
      ? {
          ...setViewboxAction,
          newSelection,
        }
      : // : r.selectWaveformItem(null)
        null
  }

  console.log(' ~~~ c')

  return setViewboxAction
}

function setViewBox(
  viewState: ViewState,
  newlySetMs: number,
  svgWidth: number,
  newSelection: ReturnType<typeof r.getNewWaveformSelectionAt>,
  seeking: boolean
) {
  const visibleTimeSpan = pixelsToMs(svgWidth, viewState.pixelsPerSecond)
  const buffer = Math.round(visibleTimeSpan * 0.1)

  const ms = newlySetMs

  const { viewBoxStartMs, durationSeconds } = viewState
  const durationMs = secondsToMs(durationSeconds)

  if (newlySetMs < viewBoxStartMs) {
    console.log('                     xxx 1')
    console.log(
      '                     newlySetMs < viewBoxStartMs',
      newlySetMs,
      viewBoxStartMs
    )
    return {
      type: 'SET_CURSOR_POSITION' as const,
      ms,
      newViewBoxStartMs: Math.max(0, newlySetMs - buffer),
    }
  }
  if (newlySetMs >= visibleTimeSpan + viewBoxStartMs) {
    console.log('                     xxx 2')
    const newViewBoxStartMs = Math.min(
      newSelection ? newSelection.item.end + buffer : newlySetMs,
      Math.max(durationMs - visibleTimeSpan, 0)
    )
    return {
      type: 'SET_CURSOR_POSITION' as const,
      ms,
      newViewBoxStartMs,
    }
  }

  if (seeking) console.log('                     xxx 3')

  return seeking
    ? {
        type: 'SET_CURSOR_POSITION' as const,
        ms,
        newViewBoxStartMs: undefined,
      }
    : undefined
}
