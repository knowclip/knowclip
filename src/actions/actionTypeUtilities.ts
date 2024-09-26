export type ActionCreatorOf<
  ActionTypesEnum extends Record<string, string>,
  BaseActionCreators extends ActionCreators<ActionTypesEnum>,
  T extends ActionTypesEnum[keyof ActionTypesEnum]
> = BaseActionCreators[PropertyHavingValue<ActionTypesEnum, T>]
type PropertyHavingValue<EnumType, V> = {
  [K in keyof EnumType]: EnumType[K] extends V ? K : never
}[keyof EnumType]

export type ActionCreators<ActionTypesEnum extends Record<string, string>> = {
  [K in keyof ActionTypesEnum]: (...args: any[]) => {
    type: ActionTypesEnum[K]
  }
}
