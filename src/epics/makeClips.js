import { flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import { join } from 'path'
import ffmpeg, { toTimestamp } from '../utils/ffmpeg'

// import electron from 'electron'
// const {
//   remote: { dialog },
// } = electron
// const showOpenDialog = () =>
//   new Promise((res, rej) => {
//     try {
//       dialog.showOpenDialog({ properties: ['openDirectory'] }, filePaths =>
//         res(filePaths)
//       )
//     } catch (err) {
//       rej(err)
//     }
//   })

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
          res(`${outputFilename} successfully created.`)
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
    flatMap(async () => {
      try {
        const clipIds = Object.keys(state$.value.clips)
        const directory = r.getMediaFolderLocation(state$.value)
        const clipsOperations = clipIds.map(clipId => {
          const {
            start,
            end,
            filePath,
            outputFilename,
          } = r.getClipOutputParameters(state$.value, clipId)
          const outputFilePath = join(directory, outputFilename)
          console.log('clipping: filePath, start, end, outputFilePath')
          console.log(filePath, start, end, outputFilePath)
          return clip(filePath, start, end, outputFilePath)
        })
        await Promise.all(clipsOperations)

        return r.simpleMessageSnackbar('Clips made in ' + directory)
      } catch (err) {
        return r.simpleMessageSnackbar(
          `There was a problem making clips: ${err.message}`
        )
      }
    })
  )

export default makeClips
