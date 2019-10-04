import deleteKey from '../utils/deleteKey'

export const reducer = (state, action) => {
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
export const getFormState = fieldKeys => {
  const state = { fields: {}, errors: {} }
  fieldKeys.forEach(key => {
    state.fields[key] = ''
  })
  return state
}

export const getFieldValue = (state, key) => state.fields[key]
export const getFieldError = (state, key) => state.errors[key]

export const setFieldValue = (key, value) => ({
  type: 'SET_FIELD_VALUE',
  key,
  value,
})
export const setErrors = errors => ({
  type: 'SET_ERRORS',
  errors,
})
