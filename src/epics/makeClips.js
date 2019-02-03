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
      // .audioCodec('copy') // later, do this and change hardcoded '.mp3' for audio-only input
      .seekInput(toTimestamp(startTime))
      .inputOptions('-to ' + toTimestamp(endTime))
      .outputOptions('-vn')
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
      const directory = r.getMediaFolderLocation(state$.value)

      if (!directory)
        return r.mediaFolderLocationFormDialog(r.makeClips(), true)

      try {
        const clipIds = Object.keys(state$.value.clips.byId)
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

        return await r.simpleMessageSnackbar('Clips made in ' + directory)
      } catch (err) {
        return await r.simpleMessageSnackbar(
          `There was a problem making clips: ${err.message}`
        )
      }
    })
  )

export default makeClips
