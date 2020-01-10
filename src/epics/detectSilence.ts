import { flatMap, map } from 'rxjs/operators'
import { from, Observable } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import ffmpeg from '../utils/ffmpeg'
import uuid from 'uuid/v4'
import newClip from '../utils/newClip'
import { AppEpic } from '../types/AppEpic'

const detectSilence = (
  path: string,
  silenceDuration = 1,
  silenceNoiseTolerance = -40
): Promise<{ start: number; end: number }[]> =>
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
          // window.preparedString = preparedString

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

const detectSilenceEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, DetectSilence>(A.DETECT_SILENCE),
    flatMap<DetectSilence, Promise<Action[]>>(() => {
      const currentFilePath = r.getCurrentFilePath(state$.value)
      const currentMedia = r.getCurrentMediaFile(state$.value)
      if (!currentMedia || !currentFilePath)
        throw new Error('Illegal: no media file loaded')

      return detectSilence(currentFilePath).then(silences => {
        if (!silences.length)
          return [
            r.simpleMessageSnackbar(
              'There was too much noise to detect silences automatically.'
            ),
          ]

        const chunks: Array<{ start: number; end: number }> = []
        if (silences[0].start > 0)
          chunks.push({ start: 0, end: silences[0].start })
        silences.forEach(({ end: silenceEnd }, i) => {
          const nextSilence = silences[i + 1]
          if (nextSilence) {
            chunks.push({ start: silenceEnd, end: nextSilence.start })
          } else {
            const durationMs = currentMedia.durationSeconds * 1000
            if (silenceEnd !== durationMs)
              chunks.push({ start: silenceEnd, end: durationMs })
          }
        })

        const fileId = r.getCurrentFileId(state$.value)
        const currentNoteType = r.getCurrentNoteType(state$.value)
        if (!fileId) throw new Error('Illegal: no media file loaded')
        if (!currentNoteType) throw new Error('Illegal: no note type found')

        const newClips = chunks.map(({ start, end }) =>
          newClip(
            // shoudl have fewer arguments
            {
              start: r.getXAtMilliseconds(state$.value, start),
              end: r.getXAtMilliseconds(state$.value, end),
            },
            fileId,
            uuid(),
            currentNoteType === 'Simple'
              ? {
                  transcription: '',
                  meaning: '',
                  notes: '',
                }
              : {
                  transcription: '',
                  meaning: '',
                  notes: '',
                  pronunciation: '',
                },
            r.getDefaultTags(state$.value)
          )
        )

        return [
          r.deleteCards(r.getClipIdsByMediaFileId(state$.value, fileId)),
          r.addClips(newClips, fileId),
        ]
      })
    }),
    flatMap<Array<Action>, Observable<Action>>(val => from(val))
  )

const detectSilenceRequestEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, DetectSilenceRequest>(A.DETECT_SILENCE_REQUEST),
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
