import validateProject from '../node/validateProject'
import {
  ProjectMetadataJson,
  SimpleFlashcardFields,
  MediaJson,
} from '../types/Project'
import { describe, it, expect } from 'vitest'

describe('validateProject', () => {
  it('returns error for invalid project', () => {
    const result = validateProject({ boop: 'hi' }, [{ boop: 'ho' }])

    expect(result.errors).toHaveProperty('Project')
  })

  it('returns errors for invalid media', () => {
    const validProjectJson: ProjectMetadataJson = {
      id: 'abcde-fghij-klmno',
      name: 'my cool project',
      createdAt: '2020-01-27T12:35:20Z',
      timestamp: '2020-01-28T12:35:20Z',
      noteType: 'Simple',
    }
    const result = validateProject(validProjectJson, [{ boop: 'scoop' }])

    expect(result.errors).toHaveProperty('Media file 1')
  })

  it('returns data for valid project', () => {
    const validProjectJson: ProjectMetadataJson = {
      id: 'abcde-fghij-klmno',
      name: 'my cool project',
      createdAt: '2020-01-27T12:35:20Z',
      timestamp: '2020-01-28T12:35:20Z',
      noteType: 'Simple',
    }
    const validMediaJson: MediaJson<SimpleFlashcardFields> = {
      id: 'pqrst-uvwxy-zabcd',
      name: 'hello.mp4',
      format: 'mp4',
      width: 800,
      height: 600,
      duration: '10:00.0',
      clips: [{ id: 'abc', start: '00:10.0', end: '00:18.0' }],
    }

    const result = validateProject(validProjectJson, [validMediaJson])

    expect(result).toHaveProperty('success')
  })
})
