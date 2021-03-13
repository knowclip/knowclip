import { useCallback, MutableRefObject, useEffect } from 'react'
import r from '../redux'
import { getXAtMillisecondsFromWaveform } from '../utils/waveformCoordinates'
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
    waveformLength,
    dispatch: dispatchViewState,
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
    // console.log({ localChange, remoteChange, notSyncedWithRemote})
    if (localChange && notSyncedWithRemote) {
      dispatch(r.selectWaveformItem(waveform.state.selection))
    }
    if (remoteChange && notSyncedWithRemote) {
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

  return useCallback(
    (
      media: HTMLVideoElement | HTMLAudioElement,
      seeking: MutableRefObject<boolean>
    ) => {
      const svg = svgRef.current
      if (!svg) return console.error('Svg disappeared')

      const newlyUpdatedTime = media.currentTime
      const newMilliseconds = newlyUpdatedTime * 1000
      const newXAtMilliseconds = getXAtMillisecondsFromWaveform(newMilliseconds)

      const possibleNewSelection = r.getNewWaveformSelectionAtFromSubset(
        remoteSelection,
        waveform.waveformItems,
        newXAtMilliseconds
      )
      const factor = waveform.state.stepLength * waveform.state.stepsPerSecond
      const halfSecond = factor / 2
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

      // loop stuff here
      const x = doWaveformUpdate(
        waveform.state,
        waveformLength,
        newlyUpdatedTime,
        svg,
        newSelection,
        wasSeeking,
        remoteSelection
      )
      x.forEach((a) => dispatchViewState(a))
    },
    [
      dispatchViewState,
      doWaveformUpdate,
      remoteSelection,
      svgRef,
      waveform.state,
      waveform.waveformItems,
      waveformLength,
    ]
  )
}
