const truncate = (str, maxLength) => {
  if (str.length > maxLength) {
    return (
      str.substr(0, ~~(maxLength / 2) - 3) +
      '...' +
      str.substr(str.length - ~~(maxLength / 2), str.length)
    )
  }
  return str
}
export default truncate
