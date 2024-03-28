const deleteKey = <T extends object>(obj: T, key: keyof T) => {
  const clone = { ...obj }
  delete clone[key]
  return clone
}

export default deleteKey
