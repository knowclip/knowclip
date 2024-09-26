// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare type Action = import('../actions').KnowclipAction

declare interface UpdateFileWith<T extends keyof FileUpdates> {
  type: import('./ActionType').default.updateFile
  update: FileUpdate<T>
}
