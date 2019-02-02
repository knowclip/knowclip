import { flatMap, withLatestFrom } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { from, of } from 'rxjs'
import { setWaveformPeaks } from '../actions'
import decodeAudioData, { getPeaks } from '../utils/getWaveform'

const getWaveformEpic = (action$, state$) =>
  action$.pipe(
    ofType('LOAD_AUDIO_SUCCESS'),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    flatMap(([{ file } /*{ audioElement } */]) => {
      if (!file) {
        return of(setWaveformPeaks([]))
      }

      return from(decodeAudioData(file)).pipe(
        flatMap(({ buffer }) =>
          of(
            setWaveformPeaks(
              getPeaks(buffer, state$.value.waveform.stepsPerSecond)
            )
          )
        )
      )
    })
  )

export default getWaveformEpic
