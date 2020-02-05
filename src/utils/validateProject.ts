import Ajv from 'ajv'
import projectMetadataJsonSchema from './validateProjectMetadata.json'
import mediaJsonSchema from './validateProjectMedia.json'
import betterAjvErrors from 'better-ajv-errors'

const ajv = new Ajv({ jsonPointers: true })

const validateProjectMetadata = ajv.compile(projectMetadataJsonSchema)
const validateMedia = ajv.compile(mediaJsonSchema)

const getErrors = (
  schema: any,
  json: any,
  errors: Ajv.ErrorObject[] | null | undefined
) => {
  const result: string = betterAjvErrors(schema, json, errors, {
    // with default format: cli option, returns a string
    // contrary to typings.
    indent: 2,
  }) as any

  return result
}

export default function validateProject(project: any, media: any[]) {
  const errors: { [section: string]: string } = {}

  const projectValid = validateProjectMetadata(project)
  if (!projectValid)
    errors['Project'] = getErrors(
      projectMetadataJsonSchema,
      project,
      validateProjectMetadata.errors
    )

  media.forEach((mediaJson, i) => {
    const mediaValid = validateMedia(mediaJson)

    if (!mediaValid)
      errors[`Media file ${i + 1}`] = getErrors(
        mediaJsonSchema,
        mediaJson,
        validateMedia.errors
      )
  })

  return Object.keys(errors).length ? { errors } : { success: true }
}
