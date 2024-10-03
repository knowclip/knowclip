import type { ElectronApi } from '../preload'

export function basename(
  platform: ElectronApi['platform'],
  filepath: string,
  ext?: string
) {
  const delimiter = platform === 'win32' ? '\\' : '/'
  const indexOfLastDelimiter = filepath.lastIndexOf(delimiter)
  const WithExtension =
    indexOfLastDelimiter === -1
      ? filepath
      : filepath.slice(indexOfLastDelimiter + 1)
  return ext ? WithExtension.replace(ext, '') : WithExtension
}

export function join(platform: ElectronApi['platform'], ...paths: string[]) {
  const delimiter = platform === 'win32' ? '\\' : '/'
  return paths.join(delimiter)
}

/** Return the extension of the path, from the last '.' to end of string in the last portion of the path. If there is no '.' in the last portion of the path or the first character of it is '.', then it returns an empty string. */
export function extname(platform: ElectronApi['platform'], filepath: string) {
  const fileBasename = basename(platform, filepath)
  const indexOfLastDot = fileBasename.lastIndexOf('.')
  return indexOfLastDot === -1 || indexOfLastDot === 0
    ? ''
    : fileBasename.slice(indexOfLastDot)
}

/** Does not work like Node `dirname` for e.g. root paths */
export function dirname(platform: ElectronApi['platform'], filepath: string) {
  const delimiter = platform === 'win32' ? '\\' : '/'
  const indexOfLastDelimiter = filepath.lastIndexOf(delimiter)
  return indexOfLastDelimiter === -1
    ? ''
    : filepath.slice(0, indexOfLastDelimiter)
}
