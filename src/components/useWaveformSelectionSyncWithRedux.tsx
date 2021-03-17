import { MutableRefObject, useEffect } from 'react'
import r from '../redux'
import { WaveformInterface } from './useWaveform'
import { usePrevious } from '../utils/usePrevious'
import { useDispatch, useSelector } from 'react-redux'
import { areSelectionsEqual } from '../utils/waveformSelection'
import { msToSeconds } from '../utils/waveform'

export function useWaveformSelectionSyncWithRedux(
  waveform: WaveformInterface,
  mediaRef: MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>
) {
  const waveformDispatch = waveform.dispatch
  const dispatch = useDispatch()
  const { editing, remoteSelection } = useSelector((state: AppState) => ({
    editing: r.isUserEditingCards(state),
    remoteSelection: r.getWaveformSelection(state),
  }))

  const previousRemoteSelection = usePrevious(remoteSelection)
  const previousLocalSelection = usePrevious(waveform.state.selection)
  const currentLocalSelection = waveform.state.selection
  useEffect(() => {
    const localChange = !areSelectionsEqual(
      currentLocalSelection,
      previousLocalSelection || null
    )
    const remoteChange = !areSelectionsEqual(
      remoteSelection,
      previousRemoteSelection || null
    )
    const notSyncedWithRemote = !areSelectionsEqual(
      remoteSelection,
      currentLocalSelection
    )

    if (localChange && notSyncedWithRemote) {
      dispatch(r.selectWaveformItem(currentLocalSelection))
      if (currentLocalSelection && editing) dispatch(r.stopEditingCards())
    }
    if (remoteChange && notSyncedWithRemote) {
      if (remoteSelection) {
        if (mediaRef.current) {
          mediaRef.current.currentTime = msToSeconds(remoteSelection.item.start)
        }
      } else console.warn('REMOTE DESELECTION')
    }
  }, [
    dispatch,
    previousLocalSelection,
    previousRemoteSelection,
    remoteSelection,
    waveformDispatch,
    currentLocalSelection,
    mediaRef,
    editing,
  ])
}
