import { flatMap, map, withLatestFrom } from 'rxjs/operators'
import { from } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import ffmpeg from '../utils/ffmpeg'
import uuid from 'uuid/v4'
import newClip from '../utils/newClip'

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

const detectSilenceEpic = (action$, state$) =>
  action$.pipe(
    ofType('DETECT_SILENCE'),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    flatMap(([_ /*{ audioElement }*/]) => {
      const audioElement = document.getElementById('audioPlayer')
      const currentFilePath = r.getCurrentFilePath(state$.value)
      return detectSilence(currentFilePath).then(silences => {
        if (!silences.length)
          return [
            r.simpleMessageSnackbar(
              'There was too much noise to detect silences automatically.'
            ),
          ]

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

        const filePath = r.getCurrentFilePath(state$.value)
        const currentNoteType = r.getCurrentNoteType(state$.value)
        const newSelections = chunks.map(({ start, end }) =>
          newClip(
            {
              start: r.getXAtMilliseconds(state$.value, start),
              end: r.getXAtMilliseconds(state$.value, end),
            },
            filePath,
            uuid(),
            currentNoteType,
            currentNoteType.useTagsField ? r.getDefaultTags(state$.value) : []
          )
        )

        return from([
          r.deleteCards(r.getClipIdsByFilePath(state$.value, filePath)),
          r.addWaveformSelections(newSelections, filePath),
        ])
      })
    }),
    flatMap(val => from(val))
  )

const detectSilenceRequestEpic = (action$, state$) =>
  action$.pipe(
    ofType('DETECT_SILENCE_REQUEST'),
    map(() =>
      r.doesCurrentFileHaveClips(state$.value)
        ? r.confirmationDialog(
            'This action will delete all flashcards and clips for the current file. Are you sure you want to continue?',
            r.detectSilence()
          )
        : r.detectSilence()
    )
  )

export default combineEpics(detectSilenceEpic, detectSilenceRequestEpic)
