import { flushSync } from 'react-dom'
import { defer, Observable } from 'rxjs'
import { mergeAll } from 'rxjs/operators'

export const afterUpdates = <T>(callback: () => Promise<Observable<T>>) =>
  defer(async () => {
    await null
    return await flushSync(() => callback())
  }).pipe(mergeAll())
