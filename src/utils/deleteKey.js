const deleteKey = (obj, key) => {
  const clone = { ...obj }
  delete clone[key]
  return clone
}

export default deleteKey
