import { parse } from 'yaml'
import { readFile } from 'fs/promises'
import { ProjectJson } from '../types/Project'
import validateProject from './validateProject'

export type NormalizedProjectFileData = {
  project: ProjectFile
  media: MediaFile[]
  clips: Clip[]
  cards: Flashcard[]
  subtitles: SubtitlesFile[]
}

export const parseProjectJson = async <F extends FlashcardFields>(
  filePath: string
): AsyncResult<ProjectJson<F>> => {
  try {
    const docsText = (await readFile(filePath, 'utf8'))
      .split(/(?:^|\r?\n)(?:---|\.\.\.)\r?\n/)
      .filter((x) => x.trim())
    const errors: string[] = []
    const docs = docsText.map((text) => {
      try {
        const doc = parse(text, {
          maxAliasCount: -1,
        })
        return doc
      } catch (err) {
        console.error(err)
        errors.push(String(err))
        return null
      }
    })

    if (errors.length) return { errors }

    const [project, ...media] = docs

    const validation = validateProject(project, media)

    if (validation.errors)
      return {
        errors: Object.entries(validation.errors).map(
          ([sectionName, bigErrorMessage]) => {
            return `Invalid data for ${sectionName}:\n\n${bigErrorMessage}`
          }
        ),
      }

    return {
      value: {
        project,
        media,
      },
    }
  } catch (err) {
    return { errors: [String(err)] }
  }
}
