import { AnyAction } from "redux";
import { initialUndoableState } from "../types";
import { isUiUndoableAction, uiUndoableActionNames } from "./types";

export function uiUndoableReducer(state = initialUndoableState, action: AnyAction) {
  if (isUiUndoableAction(action)) {
    switch (action.type) {
      case uiUndoableActionNames.SELECT_CELL:
        return { ...state, selection: action.id };
      default:
        return state;
    }
  }
  return state;
}
