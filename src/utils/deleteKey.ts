const deleteKey = <T extends Object>(obj: T, key: keyof T) => {
  const clone = { ...obj }
  delete clone[key]
  return clone
}

export default deleteKey
