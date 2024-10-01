export const failure = (thrownValue: unknown): Failure => {
  console.error(thrownValue)
  return {
    error:
      thrownValue instanceof Error
        ? thrownValue
        : new Error(String(thrownValue)),
  }
}
