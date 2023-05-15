import { ffmpeg, toTimestamp } from './ffmpeg'
import { secondsToMs } from 'clipwave'

export const WAVE_COLOR = '#b7cee0'
export const BG_COLOR = '#00000000'
export const CORRECTION_OFFSET = 0

export function createWaveformPng(
  mediaFilePath: string,
  file: WaveformPng,
  width: number,
  outputFilename: string
): string | PromiseLike<string> {
  return new Promise((res, rej) => {
    return ffmpeg(mediaFilePath)
      .seekInput(toTimestamp(secondsToMs(file.startSeconds)))
      .inputOptions(`-to ${toTimestamp(secondsToMs(file.endSeconds))}`)
      .withNoVideo()
      .complexFilter(
        [
          `[0:a]aformat=channel_layouts=mono,`,
          `compand=gain=-6,`,
          `showwavespic=s=${
            width + CORRECTION_OFFSET
          }x70:colors=${WAVE_COLOR},setpts=0[fg];`,
          `color=s=${width + CORRECTION_OFFSET}x70:color=${BG_COLOR}[bg];`,
          `[bg][fg]overlay=format=rgb,drawbox=x=(iw-w)/2:y=(ih-h)/2:w=iw:h=2:color=${WAVE_COLOR}`,
        ].join(''),
        [] // why needed?
      )
      .outputOptions('-frames:v 1')
      .output(outputFilename)
      .on('end', function () {
        res(outputFilename)
      })
      .on('error', (err: any) => {
        rej(err)
      })
      .run()
  })
}
