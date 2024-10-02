export const failure = (thrownValue: unknown): Failure => {
  const error =
    thrownValue instanceof Error ? thrownValue : new Error(String(thrownValue))
  console.error(error)
  return {
    error,
  }
}
