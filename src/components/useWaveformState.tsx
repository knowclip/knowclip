import { useCallback, useMemo, useReducer, useRef } from 'react'
import r from '../redux'
import { pixelsToMs, WaveformSelectionExpanded } from '../selectors'
import { limitSelectorToDisplayedItems } from '../selectors/limitSelectorToDisplayedItems'
import { elementWidth } from '../utils/media'
import { WaveformDragAction } from '../utils/WaveformMousedownEvent'
import { areSelectionsEqual } from '../utils/waveformSelection'

const initialState: ViewState = {
  cursorMs: 0,
  durationSeconds: 0,
  viewBoxStartMs: 0,
  stepsPerSecond: 25,
  stepLength: 1,
  selection: null,
  pendingAction: null,
}

export function useWaveformState(waveformItems: WaveformSelectionExpanded[]) {
  const limitWaveformItemsToDisplayed = limitSelectorToDisplayedItems(
    (waveformItem: WaveformSelectionExpanded) => waveformItem.item.start,
    (waveformItem: WaveformSelectionExpanded) => waveformItem.item.end
  )

  const svgRef = useRef<SVGSVGElement>(null)
  const [state, dispatch] = useReducer(updateViewState, initialState)
  const onMediaLoaded = useCallback(
    (media: HTMLVideoElement | HTMLAudioElement | null) => {
      dispatch({ type: 'reset', durationSeconds: media?.duration || 0 })
    },
    [dispatch]
  )
  return {
    svgRef,
    state,
    dispatch,
    doWaveformUpdate,
    onMediaLoaded,
    waveformItems: useMemo(
      () => limitWaveformItemsToDisplayed(waveformItems, state.viewBoxStartMs),
      [limitWaveformItemsToDisplayed, waveformItems, state.viewBoxStartMs]
    ),
  }
}

export type WaveformAction =
  | {
      type: 'selectWaveformItem'
      selection: WaveformSelection | null
    }
  | {
      type: 'SET_CURSOR_POSITION'
      ms: number
      newViewBoxStartMs?: number | undefined
      newSelection?: WaveformSelection | null | undefined
    }
  | { type: 'setPendingAction'; action: WaveformDragAction | null }
  | { type: 'continuePendingAction'; ms: number }
  | { type: 'reset'; durationSeconds: number }

function updateViewState(state: ViewState, action: WaveformAction): ViewState {
  switch (action.type) {
    case 'reset':
      return { ...initialState, durationSeconds: action.durationSeconds }
    case 'setPendingAction':
      return {
        ...state,
        pendingAction: action.action,
      }
    case 'continuePendingAction':
      return {
        ...state,
        pendingAction: state.pendingAction
          ? {
              ...state.pendingAction,
              end: action.ms,
            }
          : null,
      }
    case 'selectWaveformItem':
      return {
        ...state,
        selection: action.selection,
      }
    case 'SET_CURSOR_POSITION': {
      const newViewBoxStartMs =
        typeof action.newViewBoxStartMs === 'number'
          ? action.newViewBoxStartMs
          : state.viewBoxStartMs
      console.log(
        'cursorMs:',
        `${action.ms}`.padStart(10, ' '),
        'newViewBoxStartMs',
        newViewBoxStartMs
      )
      return {
        ...state,
        cursorMs: action.ms,
        viewBoxStartMs: newViewBoxStartMs,
        selection:
          typeof action.newSelection === 'undefined'
            ? state.selection
            : action.newSelection,
      }
    }
    default:
      return state
  }
}

function doWaveformUpdate(
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
    console.log(' ~~~ b')
    return setViewboxAction
      ? {
          ...setViewboxAction,
          newSelection,
        }
      : r.selectWaveformItem(null)
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
  const visibleTimeSpan = pixelsToMs(svgWidth)
  const buffer = Math.round(visibleTimeSpan * 0.1)

  const ms = newlySetMs

  const { viewBoxStartMs, durationSeconds } = viewState
  const durationMs = durationSeconds * 1000

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
