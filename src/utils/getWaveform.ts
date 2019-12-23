import ffmpeg, { getMediaMetadata } from '../utils/ffmpeg'
import { getWaveformPngPath } from '../utils/localStorage'
import { existsSync } from 'fs'

const BG_COLOR = '#f0f8ff'
const WAVE_COLOR = '#555555'
const CORRECTION_OFFSET = 0

export const getWaveformPng = async (
  state: AppState,
  file: WaveformPng,
  constantBitrateFilePath: string
): Promise<string> => {
  const ffprobeMetadata = await getMediaMetadata(constantBitrateFilePath)
  const {
    format: { duration = 0 },
  } = ffprobeMetadata
  const { stepsPerSecond, stepLength } = state.waveform
  const width = ~~(duration * (stepsPerSecond * stepLength))

  const outputFilename = getWaveformPngPath(state, file)
  if (outputFilename && existsSync(outputFilename)) return outputFilename

  return await new Promise((res, rej) => {
    ffmpeg(constantBitrateFilePath)
      .complexFilter(
        [
          `[0:a]aformat=channel_layouts=mono,`,
          `compand=gain=-6,`,
          `showwavespic=s=${width +
            CORRECTION_OFFSET}x70:colors=${WAVE_COLOR}[fg];`,
          `color=s=${width + CORRECTION_OFFSET}x70:color=${BG_COLOR}[bg];`,
          `[bg][fg]overlay=format=rgb,drawbox=x=(iw-w)/2:y=(ih-h)/2:w=iw:h=2:color=${WAVE_COLOR}`,
        ].join(''),
        [] // why needed?
      )
      .outputOptions('-frames:v 1')
      .output(outputFilename)
      .on('end', function() {
        res(outputFilename)
      })
      .on('error', (err: any) => {
        rej(err)
      })
      .run()
  })
}
