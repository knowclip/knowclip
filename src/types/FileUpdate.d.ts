declare type FileUpdates = import('../files/updates').FileUpdates

declare type FileUpdate<
  U extends keyof import('../files/updates').FileUpdates
> = {
  id: FileId
  updateName: U
  updatePayload: Tail<
    Parameters<import('../files/updates').FileUpdates[U]['update']>
  >
}
type Tail<T extends any[]> = ((...x: T) => void) extends ((
  h: infer A,
  ...t: infer R
) => void)
  ? R
  : never
