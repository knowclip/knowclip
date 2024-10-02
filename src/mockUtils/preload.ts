export const setUpMocks = <T>(id: string, module: T) => {
  console.log(
    `setUpMocks was called from PRELOAD SCRIPT with id ${id} and module`,
    module
  )
  return module
}
