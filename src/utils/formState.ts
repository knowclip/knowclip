import deleteKey from '../utils/deleteKey'
import { Reducer } from 'redux'

declare type FormState = {
  fields: FormFields
  errors: FormErrors
}
declare type FormFields = { [key: string]: string }
declare type FormErrors = { [key: string]: string }

declare type FormAction =
  | { type: 'SET_FIELD_VALUE'; key: string; value: string }
  | { type: 'SET_ERRORS'; errors: FormErrors }

export const getFormState = (fieldKeys: Array<string>) => {
  const state: FormState = { fields: {}, errors: {} }
  fieldKeys.forEach(key => {
    state.fields[key] = ''
  })
  return state
}

export const reducer: Reducer<FormState, FormAction> = (
  state = getFormState([]),
  action
) => {
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
