export function updaterGetter<F extends FileMetadata>() {
  return <U extends any[]>(updater: (file: F, ...args: U) => F) => {
    return updater
  }
}
