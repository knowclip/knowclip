// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare type Action = import('../actions').Action

declare interface UpdateFileWith<T extends keyof FileUpdates> {
  type: import('./ActionType').default.updateFile
  update: FileUpdate<T>
}
