export const setUpMocks = <T>(id: string, module: T) => {
  console.log(
    `setUpMocks was called from TEST with id ${id} and module`,
    module
  )
  return module
}
