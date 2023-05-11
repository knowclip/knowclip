import tempy from 'tempy'
import ffmpeg from '../preloaded/ffmpeg'
import { extname, basename, join } from '../preloaded/path'
import { existsSync } from '../preloaded/fs'

export const coerceMp3ToConstantBitrate = (
  path: string,
  oldConstantBitratePath: string | null
): Promise<string> => {
  // should check if mp3
  // and if possible, constant vs. variable bitrate
  return new Promise((res, rej) => {
    if (extname(path) !== '.mp3') return res(path)
    if (oldConstantBitratePath && existsSync(oldConstantBitratePath))
      return res(oldConstantBitratePath)

    const constantBitratePath = join(
      tempy.root,
      basename(path, '.mp3') + '.mp4'
    )

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
