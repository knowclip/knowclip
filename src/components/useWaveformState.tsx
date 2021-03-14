import { useCallback, useMemo, useReducer, useRef } from 'react'
import { WaveformSelectionExpanded } from '../selectors'
import { limitSelectorToDisplayedItems } from '../selectors/limitSelectorToDisplayedItems'
import { WaveformDragAction } from '../utils/WaveformMousedownEvent'

const initialState: ViewState = {
  cursorMs: 0,
  durationSeconds: 0,
  viewBoxStartMs: 0,
  pixelsPerSecond: 50,
  selection: null,
  pendingAction: null,
}

export type WaveformInterface = ReturnType<typeof useWaveformState>

export function useWaveformState(waveformItems: WaveformSelectionExpanded[]) {
  const limitWaveformItemsToDisplayed = limitSelectorToDisplayedItems(
    (waveformItem: WaveformSelectionExpanded) => waveformItem.item.start,
    (waveformItem: WaveformSelectionExpanded) => waveformItem.item.end
  )

  const svgRef = useRef<SVGSVGElement>(null)
  const [state, dispatch] = useReducer(updateViewState, initialState)
  const resetWaveformState = useCallback(
    (media: HTMLVideoElement | HTMLAudioElement | null) => {
      dispatch({ type: 'reset', durationSeconds: media?.duration || 0 })
    },
    [dispatch]
  )

  return {
    svgRef,
    state,
    dispatch,
    resetWaveformState,
    waveformItems: useMemo(
      () => limitWaveformItemsToDisplayed(waveformItems, state.viewBoxStartMs, state.pixelsPerSecond),
      [limitWaveformItemsToDisplayed, waveformItems, state.viewBoxStartMs, state.pixelsPerSecond]
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
  | { type: 'zoom'; delta: number }

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
  case 'zoom': return {
    ...state,
    pixelsPerSecond: Math.max(10, Math.min(200, state.pixelsPerSecond + action.delta))
  }
    default:
      return state
  }
}
