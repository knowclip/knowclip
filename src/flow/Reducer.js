// @flow

declare type ActionType = Object

declare type Reducer<StateType> = (StateType, ActionType) => StateType
