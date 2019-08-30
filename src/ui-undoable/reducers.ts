import { AnyAction } from "redux";
import { cellActionNames, CellId, isCellAction } from "../cells/types";
import { codeActionNames, isCodeAction } from "../code/types";
import { initialUndoableState, Undoable } from "../types";
import { isUiUndoableAction, uiUndoableActionNames } from "./types";

export function uiUndoableReducer(state = initialUndoableState, action: AnyAction): Undoable {
  if (isUiUndoableAction(action)) {
    switch (action.type) {
      case uiUndoableActionNames.SELECT_CELL:
        return selectCell(state, action.id);
      default:
        return state;
    }
  } else if (isCodeAction(action)) {
    switch (action.type) {
      case codeActionNames.INSERT_SNIPPET:
        return selectCell(state, action.cellId);
      default:
        return state;
    }
  } else if (isCellAction(action)) {
    switch (action.type) {
      case cellActionNames.INSERT_TEXT:
        return selectCell(state, action.cellId);
      case cellActionNames.INSERT_OUTPUT:
        return selectCell(state, action.cellId);
      default:
        return state;
    }
  }
  return state;
}

function selectCell(state: Undoable, id: CellId) {
  return { ...state, selectedCell: id };
}
