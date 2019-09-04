import { SetStateAction, State, stateActionNames as names } from "./types";

export function setState(state: State): SetStateAction {
  return {
    state,
    type: names.SET_STATE
  };
}
