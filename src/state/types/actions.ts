import { AnyAction } from "redux";
import * as names from "./action-names";
import { State } from "./state";

export interface SetStateAction {
  type: typeof names.SET_STATE;
  state: State;
}

export type StateActionTypes = SetStateAction;

export function isStateAction(action: AnyAction): action is StateActionTypes {
  return Object.keys(names).indexOf(action.type) !== -1;
}
