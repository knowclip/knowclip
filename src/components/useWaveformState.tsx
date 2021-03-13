import { useEffect, useMemo, useReducer, useRef } from 'react'
import r from '../redux'
import { WaveformSelectionExpanded } from '../selectors'
import { limitSelectorToDisplayedItems } from '../selectors/limitSelectorToDisplayedItems'
import { elementWidth } from '../utils/media'
import { WaveformDragAction } from '../utils/WaveformMousedownEvent'
import { areSelectionsEqual } from '../utils/waveformSelection'

const initialState = {
  cursorX: 0,
  xMin: 0,
  stepsPerSecond: 25,
  stepLength: 1,
  selection: null,
  pendingAction: null,
}

export function useWaveformState(
  mediaEl: HTMLVideoElement | HTMLAudioElement | null,
  waveformItems: WaveformSelectionExpanded[]
) {
  const limitWaveformItemsToDisplayed = limitSelectorToDisplayedItems(
    (waveformItem: WaveformSelectionExpanded) => waveformItem.item.start,
    (waveformItem: WaveformSelectionExpanded) => waveformItem.item.end
  )

  const svgRef = useRef<SVGSVGElement>(null)
  const [state, dispatch] = useReducer(updateViewState, initialState)
  const { stepsPerSecond, stepLength } = state
  const factor = stepsPerSecond * stepLength
  const durationSeconds = mediaEl?.duration || 0
  useEffect(() => {
    const reload = () => {
      dispatch({ type: 'reset' })
    }
    mediaEl?.addEventListener('load', reload)
    return () => mediaEl?.removeEventListener('load', reload)
  })
  console.log({ stepsPerSecond, stepLength, factor, durationSeconds })
  const waveformLength = durationSeconds * factor
  return {
    svgRef,
    state,
    dispatch,
    doWaveformUpdate,
    waveformLength,
    waveformItems: useMemo(
      () => limitWaveformItemsToDisplayed(waveformItems, state.xMin),
      [limitWaveformItemsToDisplayed, waveformItems, state.xMin]
    ),
  }
}

export type WaveformAction =
  | ElementOf<ReturnType<typeof doWaveformUpdate>>
  | {
      type: 'setCursorPosition'
      x: number
      xMin: number | undefined
    }
  | { type: 'setPendingAction'; action: WaveformDragAction | null }
  | { type: 'continuePendingAction'; x: number }
  | { type: 'reset' }

type ElementOf<X> = X extends Array<infer E> ? E : never
function updateViewState(state: ViewState, action: WaveformAction): ViewState {
  switch (action.type) {
    case 'reset':
      return initialState
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
              end: action.x,
            }
          : null,
      }
    case 'selectWaveformItem':
      return {
        ...state,
        selection: action.selection,
      }
    case 'setCursorPosition':
      return {
        ...state,
        cursorX: action.x,
        xMin: typeof action.xMin === 'number' ? action.xMin : state.xMin,
      }
    default:
      return state
  }
}

function doWaveformUpdate(
  viewState: ViewState,
  waveformLength: number,
  newlyUpdatedTime: number,
  svg: SVGSVGElement,
  newSelection: WaveformSelectionExpanded | null,
  wasSeeking: boolean,
  selection: WaveformSelectionExpanded | null
) {
  const waveform = viewState
  const setViewboxAction = setViewBox(
    waveformLength,
    viewState.xMin,
    newlyUpdatedTime,
    elementWidth(svg),
    newSelection,
    wasSeeking,
    waveform.stepLength * waveform.stepsPerSecond
  )

  if (newSelection && !areSelectionsEqual(selection, newSelection)) {
    return [...setViewboxAction, r.selectWaveformItem(newSelection)]
  }

  if (!newSelection && wasSeeking) {
    return [...setViewboxAction, r.clearWaveformSelection()]
  }

  return [...setViewboxAction]
}

function setViewBox(
  waveformLength: number,
  viewBoxXMin: number,
  newlySetTime: number,
  svgWidth: number,
  newSelection: ReturnType<typeof r.getNewWaveformSelectionAt>,
  seeking: boolean,
  factor: number
) {
  const newX = Math.round(newlySetTime * factor)

  const buffer = Math.round(svgWidth * 0.1)

  if (newX < viewBoxXMin) {
    return [setCursorPosition(newX, Math.max(0, newX - buffer))]
  }
  if (newX >= svgWidth + viewBoxXMin) {
    const xMin = Math.min(
      newSelection ? newSelection.item.end + buffer : newX,
      Math.max(waveformLength - svgWidth, 0)
    )
    return [setCursorPosition(newX, xMin)]
  }
  return seeking ? [setCursorPosition(newX)] : []
}

const setCursorPosition = (x: number, xMin?: number) => ({
  type: 'setCursorPosition' as const,
  x,
  xMin,
})
