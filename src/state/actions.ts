import { ActionCreators } from "redux-undo";
import { SetStateAction, State, stateActionNames as names } from "./types";

export function setState(state: State): SetStateAction {
  return {
    state,
    type: names.SET_STATE
  };
}

const undo = ActionCreators.undo;
export { undo };
