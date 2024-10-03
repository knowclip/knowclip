export const setUpMocks = <T>(id: string, module: T) => {
  console.log(
    `setUpMocks was called from MAIN PROCESS with id ${id} and module`,
    module
  )
  return module
}
