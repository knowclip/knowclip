// @flow
const deleteKey = (obj: Object, key: string) => {
  const clone = { ...obj }
  delete clone[key]
  return clone
}

export default deleteKey
