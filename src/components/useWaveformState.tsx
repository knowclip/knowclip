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
