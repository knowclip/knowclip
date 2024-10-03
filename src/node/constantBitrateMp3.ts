import { createConstantBitrateMp3 } from './ffmpeg'
import { existsSync } from 'fs'
import { extname, basename, join } from 'path'
import { rootTemporaryDirectory } from 'tempy'

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
      rootTemporaryDirectory,
      basename(path, '.mp3') + '.mp4'
    )

    // I guess by default it does CBR
    // though maybe we should check that
    // bitrate and buffersize defaults are ok.
    //   .outputOptions('-bufsize 192k')
    return createConstantBitrateMp3(path, res, constantBitratePath, rej)
  })
}
