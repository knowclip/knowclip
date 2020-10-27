import filenamify from 'filenamify'

export const sanitizeFileName = (filename: string) =>
  filenamify(
    filename
      .replace(/\s+/g, '') // Anki doesn't like spaces in image names
      .replace(/[[\]]/g, '') // for sound names
      .replace(/\..*$/, ''),
    { replacement: '-' }
  )
