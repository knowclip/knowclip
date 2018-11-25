import { flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { from, of } from 'rxjs'
import { setWaveformPeaks, loadAudioSuccess } from '../actions'
import decodeAudioData, { getPeaks } from '../utils/getWaveform'
import dataurl from 'dataurl'

const getWaveformEpic = (action$, state$) =>
  action$.pipe(
    ofType('LOAD_AUDIO'),
    flatMap(({ file, audioElement }) => {
      // window.setTimeout(() => {
      //   const reader = new FileReader()
      //   reader.onload = (e) => {
      //     audioElement.src = e.target.result
      //     audioElement.play()
      //   }
      //   reader.readAsDataURL(file)
      // }, 0)
      if (!file) {
        audioElement.src = null
        audioElement.currentTime = 0
        return of(setWaveformPeaks([]))
      }

      window.setTimeout(() => {
        audioElement.src = dataurl.convert({
          data: file,
          mimetype: 'audio/mp3',
        })
        audioElement.play()
      }, 0)

      return from(decodeAudioData(file)).pipe(
        flatMap(({ buffer }) =>
          from([
            setWaveformPeaks(
              getPeaks(buffer, state$.value.waveform.stepsPerSecond)
            ),
            loadAudioSuccess({
              filename: file.name,
              bufferLength: buffer.length,
            }),
          ])
        )
      )
    })
  )

export default getWaveformEpic
