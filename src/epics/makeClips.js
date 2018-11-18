import { tap, ignoreElements } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import electron from 'electron'
import { join, basename, extname } from 'path'
import ffmpeg from '../utils/ffmpeg'

const {
  remote: { dialog },
} = electron

const toTimestamp = milliseconds => {
  const millisecondsStamp = String(Math.round(milliseconds % 1000)).padLeft(
    3,
    '0'
  )
  const secondsStamp = String(Math.floor(milliseconds / 1000) % 60).padLeft(
    2,
    '0'
  )
  const minutesStamp = String(
    Math.floor(milliseconds / 1000 / 60) % 60
  ).padLeft(2, '0')
  const hoursStamp = String(Math.floor(milliseconds / 1000 / 60 / 60)).padLeft(
    3,
    '0'
  )
  return `${hoursStamp}:${minutesStamp}:${secondsStamp}:${millisecondsStamp}`
}

const clip = (path, startTime, endTime, outputFilename) => {
  return new Promise((res, rej) => {
    ffmpeg(path)
      .audioCodec('copy')
      .seekInput(toTimestamp(startTime))
      .inputOptions('-to ' + toTimestamp(endTime))
      .output(outputFilename)
      .on(
        'end',
        //listener must be a function, so to return the callback wrapping it inside a function
        function() {
          console.log('Finished processing')
          res()
        }
      )
      .on('error', err => {
        rej(err)
      })
      .run()
  })
}

const makeClips = (action$, state$) =>
  action$.pipe(
    ofType('MAKE_CLIPS'),
    tap(() => {
      const clips = r.getWaveformSelections(state$.value)
      dialog.showOpenDialog({ properties: ['openDirectory'] }, filePaths => {
        if (!filePaths) return

        const [directory] = filePaths
        clips.forEach(({ start, end, filePath }) => {
          const startTime = r.getMillisecondsAtX(state$.value, start)
          const endTime = r.getMillisecondsAtX(state$.value, end)
          const extension = extname(filePath)
          const filenameWithoutExtension = basename(filePath, extension)
          const outputFilename = `${filenameWithoutExtension}__${startTime}-${endTime}${extension}`
          const outputFilePath = join(directory, outputFilename)
          clip(filePath, startTime, endTime, outputFilePath)
        })
      })
    }),
    ignoreElements()
  )

export default makeClips
