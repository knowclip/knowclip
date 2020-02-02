import filenamify from 'filenamify'

export const sanitizeFileName = (filename: string) =>
  filenamify(
    filename
      .replace(/\s+/g, '') // Anki doesn't like spacs in image names
      .replace(/\..*$/, '')
      .slice(0, 40),
    { replacement: '-' }
  )
