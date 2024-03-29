import * as tempy from 'preloaded/tempy'
import { createConstantBitrateMp3 } from 'preloaded/ffmpeg'
import { extname, basename, join } from 'preloaded/path'
import { existsSync } from 'preloaded/fs'

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
      tempy.rootTemporaryDirectory,
      basename(path, '.mp3') + '.mp4'
    )

    // I guess by default it does CBR
    // though maybe we should check that
    // bitrate and buffersize defaults are ok.
    //   .outputOptions('-bufsize 192k')
    return createConstantBitrateMp3(path, res, constantBitratePath, rej)
  })
}
