import { AnyAction } from "redux";
import { insert, move } from "../common/reducers";
import { isTextAction, textActionNames } from "../text/types";
import { initialUndoableState } from "../types";
import { cellActionNames, Cells, ContentType, isCellAction } from "./types";

export function cellsReducer(state = initialUndoableState, action: AnyAction) {
  return {
    ...state,
    cells: cellsReducerForCellsSlice(state.cells, action)
  };
}

function cellsReducerForCellsSlice(state: Cells, action: AnyAction) {
  if (isCellAction(action)) {
    switch (action.type) {
      case cellActionNames.MOVE_CELL:
        return move(state, action.id, action.to);
      default:
        return state;
    }
  } else if (isTextAction(action)) {
    switch (action.type) {
      case textActionNames.CREATE_SNIPPET:
        return insert(state, action.cellId, action.index, {
          type: ContentType.SNIPPET,
          contentId: action.snippetId
        });
      default:
        return state;
    }
  }
  return state;
}
