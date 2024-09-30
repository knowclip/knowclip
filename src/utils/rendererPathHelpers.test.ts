import { it, expect, describe } from 'vitest'

import { extname, basename, join } from './rendererPathHelpers'

describe('rendererPathHelpers', () => {
  const platform = 'darwin'
  describe('extname', () => {
    it('returns the extension of a filename', () => {
      expect(extname(platform, 'file.txt')).toBe('.txt')
    })

    it('returns an empty string if there is no extension for a filename', () => {
      expect(extname(platform, 'file')).toBe('')
    })

    it('returns an empty string if the first character of filename is a dot, for a filename', () => {
      expect(extname(platform, '.file')).toBe('')
    })

    it('returns the extension for a full file path', () => {
      expect(extname(platform, '/path/to/file.txt')).toBe('.txt')
    })

    it('returns an empty string if there is no extension, for a full file path', () => {
      expect(extname(platform, '/path/to/file')).toBe('')
    })

    it('returns an empty string if the first character of the filename is a dot, for a full file path', () => {
      expect(extname(platform, '/path/to/.file')).toBe('')
    })
  })

  describe('basename', () => {
    it('returns the last part of the path, for a filename', () => {
      expect(basename(platform, 'file.txt')).toBe('file.txt')
    })

    it('returns the last part of the path, for a full file path', () => {
      expect(basename(platform, '/path/to/file.txt')).toBe('file.txt')
    })

    it('returns the last part of the path, for a filename with no extension', () => {
      expect(basename(platform, 'file')).toBe('file')
    })

    it('returns the last part of the path, for a full file path with no extension', () => {
      expect(basename(platform, '/path/to/file')).toBe('file')
    })

    it('returns the last part of the path, for a filename that starts with a dot', () => {
      expect(basename(platform, '.file')).toBe('.file')
    })

    it('returns the last part of the path, for a full file path that starts with a dot', () => {
      expect(basename(platform, '/path/to/.file')).toBe('.file')
    })
  })

  describe('join', () => {
    it('joins multiple paths together', () => {
      expect(join(platform, 'path', 'to', 'file.txt')).toBe('path/to/file.txt')
    })
  })
})
