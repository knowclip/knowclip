export const failure = (thrownValue: unknown): Failure => {
  const error =
    thrownValue instanceof Error ? thrownValue : new Error(String(thrownValue))
  console.error(error, thrownValue instanceof Error ? undefined : thrownValue)
  return {
    error,
  }
}
