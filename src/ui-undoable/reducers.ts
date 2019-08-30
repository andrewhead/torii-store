import { AnyAction } from "redux";
import { initialUndoableState, Undoable } from "../types";
import { isUiUndoableAction, uiUndoableActionNames } from "./types";

export function uiUndoableReducer(state = initialUndoableState, action: AnyAction): Undoable {
  if (isUiUndoableAction(action)) {
    switch (action.type) {
      case uiUndoableActionNames.SELECT_CELL:
        return { ...state, selectedCell: action.id };
      default:
        return state;
    }
  }
  return state;
}
