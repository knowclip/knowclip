import Ajv from 'ajv'
import betterAjvErrors from 'better-ajv-errors'

const ajv = new Ajv()

export const compile = ajv.compile.bind(ajv)

export { betterAjvErrors }
