import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { WaveformSelectionExpanded } from '../selectors'
import { limitSelectorToDisplayedItems } from '../selectors/limitSelectorToDisplayedItems'
import { usePrevious } from '../utils/usePrevious'
import { WaveformDragAction } from '../utils/WaveformMousedownEvent'
import { useWaveformMediaTimeUpdate } from './useWaveformMediaTimeUpdate'

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
      dispatch({ type: 'RESET', durationSeconds: media?.duration || 0 })
    },
    [dispatch]
  )

  const waveformInterface = {
    svgRef,
    state,
    dispatch,
    resetWaveformState,
    visibleWaveformItems: useMemo(
      () =>
        limitWaveformItemsToDisplayed(
          waveformItems,
          state.viewBoxStartMs,
          state.pixelsPerSecond
        ),
      [
        limitWaveformItemsToDisplayed,
        waveformItems,
        state.viewBoxStartMs,
        state.pixelsPerSecond,
      ]
    ),
    waveformItems: waveformItems,
  }

  return {
    onTimeUpdate: useWaveformMediaTimeUpdate(
      svgRef,
      dispatch,
      waveformItems,
      state
    ),
    ...waveformInterface,
  }
}

export type SetWaveformCursorPosition = {
  type: 'NAVIGATE_TO_TIME'
  ms: number
  viewBoxStartMs?: number
  selection?: WaveformSelection | null
}
export type WaveformAction =
  | SetWaveformCursorPosition
  | { type: 'START_WAVEFORM_MOUSE_ACTION'; action: WaveformDragAction | null }
  | { type: 'CONTINUE_WAVEFORM_MOUSE_ACTION'; ms: number }
  | { type: 'CLEAR_WAVEFORM_MOUSE_ACTION' }
  | { type: 'RESET'; durationSeconds: number }
  | { type: 'ZOOM'; delta: number }

function updateViewState(state: ViewState, action: WaveformAction): ViewState {
  switch (action.type) {
    case 'RESET':
      return { ...initialState, durationSeconds: action.durationSeconds }
    case 'START_WAVEFORM_MOUSE_ACTION':
      return {
        ...state,
        pendingAction: action.action,
      }
    case 'CONTINUE_WAVEFORM_MOUSE_ACTION':
      return {
        ...state,
        pendingAction: state.pendingAction
          ? {
              ...state.pendingAction,
              end: action.ms,
            }
          : null,
      }
    case 'NAVIGATE_TO_TIME': {
      const { ms, viewBoxStartMs, selection } = action
      return {
        ...state,
        cursorMs: ms,
        viewBoxStartMs:
          typeof viewBoxStartMs === 'number'
            ? viewBoxStartMs
            : state.viewBoxStartMs,
        selection:
          typeof selection !== 'undefined' ? selection : state.selection,
      }
    }
    case 'ZOOM':
      return {
        ...state,
        pixelsPerSecond: Math.max(
          10,
          Math.min(200, state.pixelsPerSecond + action.delta)
        ),
      }
    default:
      return state
  }
}
