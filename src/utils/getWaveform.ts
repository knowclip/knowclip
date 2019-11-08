import ffmpeg, { getMediaMetadata } from '../utils/ffmpeg'
import { getWaveformPngPath } from '../utils/localStorage'
import { existsSync } from 'fs'

const BG_COLOR = '#f0f8ff'
const WAVE_COLOR = '#555555'

export const getWaveformPng = async (
  state: AppState,
  constantBitrateFilePath: string
): Promise<string> => {
  const ffprobeMetadata = await getMediaMetadata(constantBitrateFilePath)
  const {
    format: { duration = 0 },
  } = ffprobeMetadata
  const { stepsPerSecond, stepLength } = state.waveform
  const width = ~~(duration * (stepsPerSecond * stepLength))

  const outputFilename = getWaveformPngPath(constantBitrateFilePath)
  if (outputFilename && existsSync(outputFilename)) return outputFilename

  return await new Promise((res, rej) => {
    ffmpeg(constantBitrateFilePath)
      // .audioCodec('copy') // later, do this and change hardcoded '.mp3' for audio-only input
      // @ts-ignore why does it ask for a second argument?
      .complexFilter(
        [
          `[0:a]aformat=channel_layouts=mono,`,
          `compand=gain=-6,`,
          `showwavespic=s=${width + 20}x70:colors=${WAVE_COLOR}[fg];`,
          `color=s=${width + 20}x70:color=${BG_COLOR}[bg];`,
          `[bg][fg]overlay=format=rgb,drawbox=x=(iw-w)/2:y=(ih-h)/2:w=iw:h=2:color=${WAVE_COLOR}`,
        ].join('')
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
