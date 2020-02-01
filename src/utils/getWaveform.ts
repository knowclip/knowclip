import ffmpeg, { getMediaMetadata, AsyncError } from '../utils/ffmpeg'
import tempy from 'tempy'
import { existsSync } from 'fs'
import { getFileAvailabilityById } from '../selectors'
import { basename, join } from 'path'
import { uuid } from './sideEffects'

const BG_COLOR = '#f0f8ff'
const WAVE_COLOR = '#555555'
const CORRECTION_OFFSET = 0

export const getWaveformPng = async (
  state: AppState,
  file: WaveformPng,
  constantBitrateFilePath: string
): Promise<string | AsyncError> => {
  const ffprobeMetadata = await getMediaMetadata(constantBitrateFilePath)
  if (ffprobeMetadata instanceof AsyncError) return ffprobeMetadata

  try {
    const {
      format: { duration = 0 },
    } = ffprobeMetadata
    const { stepsPerSecond, stepLength } = state.waveform
    const width = ~~(duration * (stepsPerSecond * stepLength))

    const outputFilename = getWaveformPngPath(
      state,
      constantBitrateFilePath,
      file
    )
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
  } catch (err) {
    return new AsyncError(err)
  }
}

const getWaveformPngPath = (
  state: AppState,
  constantBitrateFilePath: string,
  file: WaveformPng
) => {
  const fileAvailability = getFileAvailabilityById(
    state,
    'WaveformPng',
    file.id
  )
  if (fileAvailability.filePath && existsSync(fileAvailability.filePath)) {
    return fileAvailability.filePath
  }
  return join(
    tempy.root,
    basename(constantBitrateFilePath) + '_' + file.id + '.png'
  )
}
