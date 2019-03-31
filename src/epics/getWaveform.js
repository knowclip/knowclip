import { flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import tempy from 'tempy'
import ffmpeg, { getMediaMetadata } from '../utils/ffmpeg'
import { existsSync } from 'fs'

const BG_COLOR = '#f0f8ff'
const WAVE_COLOR = '#555555'

const getWaveformPng = async (state: AppState, path) => {
  const ffprobeMetadata = await getMediaMetadata(path)
  const {
    format: { duration },
  } = ffprobeMetadata
  console.log(ffprobeMetadata)
  const { stepsPerSecond, stepLength } = state.waveform
  const width = ~~(duration * (stepsPerSecond * stepLength))

  const pngId = 'waveform_png_for_' + path
  let outputFilename = localStorage.getItem(pngId)
  if (outputFilename && existsSync(outputFilename)) {
    return outputFilename
  }
  outputFilename = tempy.file({ extension: 'png' })
  localStorage.setItem(pngId, outputFilename)

  return await new Promise((res, rej) => {
    ffmpeg(path)
      // .audioCodec('copy') // later, do this and change hardcoded '.mp3' for audio-only input
      .complexFilter(
        [
          `[0:a]aformat=channel_layouts=mono,`,
          `compand=gain=-6,`,
          `showwavespic=s=${width + 20}x100:colors=${WAVE_COLOR}[fg];`,
          `color=s=${width + 20}x100:color=${BG_COLOR}[bg];`,
          `[bg][fg]overlay=format=rgb,drawbox=x=(iw-w)/2:y=(ih-h)/2:w=iw:h=1:color=${WAVE_COLOR}`,
        ].join('')
      )
      .outputOptions('-frames:v 1')
      .output(outputFilename)
      .on('end', function() {
        res(outputFilename)
      })
      .on('error', err => {
        rej(err)
      })
      .run()
  })
}

const getWaveformEpic = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_SUCCESS'),
    flatMap(async ({ filePath, constantBitrateFilePath }) => {
      try {
        if (!filePath) {
          return r.setWaveformImagePath(null)
        }

        const imagePath = await getWaveformPng(
          state$.value,
          constantBitrateFilePath
        )
        return r.setWaveformImagePath(imagePath)
      } catch (err) {
        console.error(err)
        return r.simpleMessageSnackbar(err.message)
      }
    })
  )

export default getWaveformEpic
