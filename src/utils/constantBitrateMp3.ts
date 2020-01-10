import tempy from 'tempy'
import fs from 'fs'
import ffmpeg from '../utils/ffmpeg'
import { extname } from 'path'

export const coerceMp3ToConstantBitrate = (
  path: string,
  oldConstantBitratePath: string | null
): Promise<string> => {
  // should check if mp3
  // and if possible, constant vs. variable bitrate
  return new Promise((res, rej) => {
    if (extname(path) !== '.mp3') return res(path)
    if (oldConstantBitratePath && fs.existsSync(oldConstantBitratePath))
      return res(oldConstantBitratePath)

    const constantBitratePath = tempy.file({ extension: 'mp4' })

    // I guess by default it does CBR
    // though maybe we should check that
    // bitrate and buffersize defaults are ok.
    //   .outputOptions('-bufsize 192k')
    ffmpeg(path)
      .audioBitrate('64k')
      .on('end', () => res(constantBitratePath))
      .on('error', rej)
      .output(constantBitratePath)
      .run()
  })
}
