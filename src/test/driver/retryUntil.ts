/** after mui v5,
 * clicking the popover menu items
 * started failing, but only sometimes
 */
export async function retryUntil({
  attemptsCount = 50,
  action,
  check,
  conditionName,
}: {
  attemptsCount?: number
  action: () => Promise<void>
  check: () => Promise<boolean>
  conditionName: string
}) {
  let attemptsMade = 0
  do {
    await action()
    attemptsMade += 1
    if (await check()) return
  } while (attemptsMade < attemptsCount)

  throw new Error(
    `Tried ${attemptsMade} times, but condition ${JSON.stringify(
      conditionName
    )} was never met`
  )
}
