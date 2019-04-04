// @flow
import deleteKey from '../utils/deleteKey'

type FormFields = { [string]: string }
type FormErrors = { [string]: string }

type FormState = Exact<{
  fields: FormFields,
  errors: FormErrors,
}>

type FormAction =
  | {| type: 'SET_FIELD_VALUE', key: string, value: string |}
  | {| type: 'SET_ERRORS', errors: FormErrors |}

export const reducer = (state: FormState, action: FormAction) => {
  switch (action.type) {
    case 'SET_FIELD_VALUE':
      return {
        ...state,
        fields: {
          [action.key]: action.value,
        },
        errors: deleteKey(state.errors, action.key),
      }
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors,
      }
    default:
      return state
  }
}
export const getFormState = (fieldKeys: Array<string>) => {
  const state = { fields: {}, errors: {} }
  fieldKeys.forEach(key => {
    state.fields[key] = ''
  })
  return state
}

export const getFieldValue = (state: FormState, key: string) =>
  state.fields[key]
export const getFieldError = (state: FormState, key: string) =>
  state.errors[key]

export const setFieldValue = (key: string, value: string): FormAction => ({
  type: 'SET_FIELD_VALUE',
  key,
  value,
})
export const setErrors = (errors: FormErrors): FormAction => ({
  type: 'SET_ERRORS',
  errors,
})
