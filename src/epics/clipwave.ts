import { ignoreElements, switchMap, tap } from 'rxjs/operators'
import A from '../types/ActionType'
import { ActionOf, actions } from '../actions'
import { combineEpics } from 'redux-observable'
import {
  recalculateRegions,
  getRegionEnd,
  msToSeconds,
  PrimaryClip,
} from 'clipwave'
import * as selectors from '../selectors'
import { SubtitlesCardBase } from '../selectors'
import { MEDIA_PLAYER_ID } from '../components/Media'

const addClipEpic: AppEpic = (action$, state$, { dispatchClipwaveEvent }) => {
  return action$.ofType<ActionOf<typeof A.addClip>>(A.addClip).pipe(
    tap(({ clip }) => {
      console.log('dispatching addclip event')
      dispatchClipwaveEvent(({ actions: { addItem } }) => {
        console.log('running addclip callback')
        addItem({
          start: clip.start,
          end: clip.end,
          clipwaveType: 'Primary',
          id: clip.id,
        })
      })
    }),
    ignoreElements()
  )
}

const addClipsEpic: AppEpic = (action$, state$, { dispatchClipwaveEvent }) => {
  return action$.ofType<ActionOf<typeof A.addClips>>(A.addClips).pipe(
    tap(({ clips }) => {
      dispatchClipwaveEvent(({ actions: { addItems } }) => {
        addItems(
          clips.map((clip) => ({
            start: clip.start,
            end: clip.end,
            clipwaveType: 'Primary',
            id: clip.id,
          }))
        )
      })
    }),
    ignoreElements()
  )
}

const stretchClipEpic: AppEpic = (
  action$,
  state$,
  { dispatchClipwaveEvent }
) => {
  return action$.ofType<ActionOf<typeof A.stretchClip>>(A.stretchClip).pipe(
    tap(({ stretchedClip, overlaps, newRegions }) => {
      dispatchClipwaveEvent(({ dispatch, state: { regions } }) => {
        const clipToStretchId = stretchedClip.id

        const newStartWithMerges = Math.min(
          ...[stretchedClip, ...overlaps].map((i) => i.start)
        )
        const newEndWithMerges = Math.max(
          ...[stretchedClip, ...overlaps].map((i) => i.end)
        )

        const newSelection = {
          item: clipToStretchId,
          regionIndex: newRegions.findIndex(
            (region, i) =>
              region.start >= newStartWithMerges &&
              getRegionEnd(newRegions, i) < newEndWithMerges
          ),
        }

        if (regions !== newRegions)
          dispatch({
            type: 'SET_REGIONS',
            regions: newRegions,
            newSelection,
            // // TODO: optimize via guarantee that new selection item is stretchedClip
            // newSelection: getNewWaveformSelectionAt(
            //   getItemDangerously,
            //   newRegions,
            //   secondsToMs(stretchedClip.start),
            //   waveform.state.selection
            // )
          })
      })
    }),
    ignoreElements()
  )
}

const moveClipEpic: AppEpic = (action$, state$, { dispatchClipwaveEvent }) => {
  return action$.ofType<ActionOf<typeof A.moveClip>>(A.moveClip).pipe(
    tap(() => {}),
    ignoreElements()
  )
}

export default combineEpics(addClipEpic, addClipsEpic, stretchClipEpic)
