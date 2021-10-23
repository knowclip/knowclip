import { ignoreElements, tap } from 'rxjs/operators'
import { EMPTY } from 'rxjs'
import r from '../redux'
import A from '../types/ActionType'
import { ActionOf } from '../actions'
import { getFreshRegions } from './getFreshRegions'
import { ofType } from 'redux-observable'

export const adjustWaveformViaHistory: AppEpic = (
  action$,
  state$,
  { dispatchClipwaveEvent, getMediaPlayer }
) =>
  action$.pipe(
    ofType(A.undo, A.redo),
    tap(() => {
      const currentFileClipsOrder = r.getCurrentFileClipsOrder(state$.value)
      const clipsMap = r.getClipsObject(state$.value)
      const subsBases = r.getSubtitlesCardBases(state$.value)

      dispatchClipwaveEvent((waveform) => {
        const { regions, newSelection } = getFreshRegions(
          currentFileClipsOrder,
          clipsMap,
          subsBases,
          waveform,
          getMediaPlayer()
        )

        waveform.dispatch({
          type: 'SET_REGIONS',
          regions,
          newSelectionItemId: newSelection.item || undefined,
          newSelectionRegion: newSelection.regionIndex,
        })
      })

      return EMPTY
    }),
    ignoreElements()
  )
