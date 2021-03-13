import { useCallback, MutableRefObject, useEffect } from 'react'
import r from '../redux'
import { overlapsSignificantly } from '../selectors'
import { useWaveformState } from './useWaveformState'
import { usePrevious } from '../utils/usePrevious'
import { useDispatch, useSelector } from 'react-redux'

export function useWaveformMediaTimeUpdate(
  svgRef: any,
  waveform: ReturnType<typeof useWaveformState>
) {
  const {
    doWaveformUpdate,
    dispatch: dispatchViewState,
    waveformItems,
  } = waveform

  const { remoteSelection } = useSelector((state: AppState) => ({
    remoteSelection: r.getWaveformSelection(state),
  }))

  const dispatch = useDispatch()

  const previousRemoteSelection = usePrevious(remoteSelection)
  const previousLocalSelection = usePrevious(waveform.state.selection)
  useEffect(() => {
    const localChange = waveform.state.selection !== previousLocalSelection
    const remoteChange = remoteSelection !== previousRemoteSelection
    const notSyncedWithRemote = remoteSelection !== waveform.state.selection
    console.log({ localChange, remoteChange, notSyncedWithRemote })
    if (localChange && notSyncedWithRemote) {
      console.log('            selecting remote')
      dispatch(r.selectWaveformItem(waveform.state.selection))
    }
    if (remoteChange && notSyncedWithRemote) {
      console.log('            selecting local')
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

      const newMilliseconds = media.currentTime * 1000

      // const remoteSelection = waveformItems.find(item => item.)
      const possibleNewSelection = r.getNewWaveformSelectionAtFromSubset(
        remoteSelection,
        waveform.waveformItems,
        newMilliseconds
      )

      const newSelection =
        remoteSelection &&
        remoteSelection.type === 'Clip' &&
        possibleNewSelection &&
        possibleNewSelection.type === 'Preview'
          ? overlapsSignificantly(
              possibleNewSelection.item,
              remoteSelection.item.start,
              remoteSelection.item.end
            )
            ? null
            : possibleNewSelection
          : possibleNewSelection

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
        const selectionStartTime = selectionItem.start * 1000
        media.currentTime = selectionStartTime
        return dispatchViewState({
          type: 'SET_CURSOR_POSITION',
          ms: selectionItem.start,
          newViewBoxStartMs: undefined,
        })
      }

      const waveformupdate = doWaveformUpdate(
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
      doWaveformUpdate,
      remoteSelection,
      svgRef,
      waveform.state,
      waveform.waveformItems,
      waveformItems,
    ]
  )

  return { onTimeUpdate }
}
