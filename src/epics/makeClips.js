import { tap, ignoreElements } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import electron from 'electron'
import { join } from 'path'
import ffmpeg, { toTimestamp } from '../utils/ffmpeg'

const {
  remote: { dialog },
} = electron

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
      const clipIds = Object.keys(state$.value.clips)
      dialog.showOpenDialog({ properties: ['openDirectory'] }, filePaths => {
        if (!filePaths) return

        const [directory] = filePaths
        clipIds.forEach(clipId => {
          const {
            start,
            end,
            filePath,
            outputFilename,
          } = r.getClipOutputParameters(state$.value, clipId)
          const outputFilePath = join(directory, outputFilename)
          clip(filePath, start, end, outputFilePath)
        })
      })
    }),
    ignoreElements()
  )

export default makeClips
