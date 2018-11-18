import { flatMap, withLatestFrom } from 'rxjs/operators'
import { from } from 'rxjs'
import { ofType } from 'redux-observable'
import uuid from 'uuid/v4'
import * as r from '../redux'
import electron from 'electron'
import ffmpeg from '../utils/ffmpeg'

const detectSilence = (
  path,
  silenceDuration = 1,
  silenceNoiseTolerance = -60
) =>
  new Promise((res, rej) => {
    ffmpeg(path, { stdoutLines: 0 })
      .audioFilters(
        `silencedetect=n=${silenceNoiseTolerance}dB:d=${silenceDuration}`
      )
      .outputFormat('null')
      .output('-')
      .on(
        'end',
        //listener must be a function, so to return the callback wrapping it inside a function
        function(_, string) {
          const preparedString = string.replace(/\s/g, ' ')
          const regex = /silence_start:\s(\d+\.\d+|\d+).+?silence_end:\s(\d+\.\d+|\d+)/g
          window.preparedString = preparedString

          const matchData = []
          let addition
          while ((addition = regex.exec(preparedString))) {
            // eslint-disable-line no-cond-assign
            const [, startStr, endStr] = addition
            matchData.push({
              start: Number(startStr) * 1000,
              end: Number(endStr) * 1000,
            })
          }
          res(matchData)
        }
      )
      .on('error', err => {
        rej(err)
        console.error(err)
      })
      .run()
  })

const ascending = (a, b) => a - b
const sortSelectionPoints = ({ start, end }) => [start, end].sort(ascending)
const getFinalSelection = (pendingSelection, currentFileName) => {
  const [start, end] = sortSelectionPoints(pendingSelection)
  return { start, end, id: uuid(), filePath: currentFileName }
}
const detectSilenceEpic = (action$, state$) =>
  action$.pipe(
    ofType('DETECT_SILENCE'),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    flatMap(([_, { audioElement }]) => {
      return detectSilence(r.getCurrentFilePath(state$.value)).then(
        silences => {
          if (!silences.length) return [{ type: 'NOOP' }]

          const chunks = []
          if (silences[0].start > 0)
            chunks.push({ start: 0, end: silences[0].start })
          silences.forEach(({ end: silenceEnd }, i) => {
            const nextSilence = silences[i + 1]
            if (nextSilence) {
              chunks.push({ start: silenceEnd, end: nextSilence.start })
            } else {
              const durationMs = audioElement.duration * 1000
              if (silenceEnd !== durationMs)
                chunks.push({ start: silenceEnd, end: durationMs })
            }
          })

          return chunks.map(({ start, end }) =>
            r.addWaveformSelection(
              getFinalSelection(
                {
                  start: r.getXAtMilliseconds(state$.value, start),
                  end: r.getXAtMilliseconds(state$.value, end),
                },
                r.getCurrentFilePath(state$.value)
              )
            )
          )
        }
      )
    }),
    flatMap(val => from(val))
  )

export default detectSilenceEpic
