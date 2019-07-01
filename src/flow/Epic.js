type StateObservable = {
  value: AppState,
}

declare type Epic<T> = (
  action$: rxjs$Observable<Action>,
  state$: StateObservable,
  dependencies: EpicsDependencies
) => rxjs$Observable<T>
