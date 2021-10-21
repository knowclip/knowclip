import { ignoreElements, mergeMap, tap } from 'rxjs/operators'
import A from '../types/ActionType'
import { ActionOf, actions } from '../actions'
import { combineEpics } from 'redux-observable'
import { getRegionEnd } from 'clipwave'
import { getNewFlashcardForStretchedClip } from '../selectors'
import { EMPTY, of } from 'rxjs'

const addClipEpic: AppEpic = (action$, state$, { dispatchClipwaveEvent }) => {
  return action$.ofType<ActionOf<typeof A.addClip>>(A.addClip).pipe(
    tap(({ clip }) => {
      dispatchClipwaveEvent(({ actions: { addItem } }) => {
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
    mergeMap(
      ({
        stretchedClip,
        unstretchedClip,
        overlaps,
        newRegions,
        frontOverlappedSubtitlesCardBases,
        backOverlappedSubtitlesCardBases,
      }) => {
        dispatchClipwaveEvent(
          ({ dispatch: clipwaveDispatch, state: { regions } }) => {
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
              clipwaveDispatch({
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
          }
        )

        if (
          frontOverlappedSubtitlesCardBases.length ||
          backOverlappedSubtitlesCardBases.length
        ) {
          // const bases = getSubtitlesCardBases(state$.value)
          const newFields = getNewFlashcardForStretchedClip(
            state$.value,
            unstretchedClip,
            stretchedClip,
            {
              front: frontOverlappedSubtitlesCardBases,
              back: backOverlappedSubtitlesCardBases,
            }
          )

          // add overlapped text to stretched clip
          return of(actions.editClip(stretchedClip.id, null, newFields))
        }
        return EMPTY
      }
    )
    // ignoreElements()
  )
}

export default combineEpics(addClipEpic, addClipsEpic, stretchClipEpic)
