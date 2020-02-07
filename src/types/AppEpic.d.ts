declare type AppEpic = import('redux-observable').Epic<
  Action,
  Action,
  AppState,
  import('../epicsDependencies').EpicsDependencies
>

declare type EpicsDependencies = import('../epicsDependencies').EpicsDependencies
