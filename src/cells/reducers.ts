import { AnyAction } from "redux";
import { codeActionNames, isCodeAction } from "../code/types";
import { insert, move } from "../common/reducers";
import { initialUndoableState } from "../state/types";
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
      case cellActionNames.INSERT_TEXT:
        return insert(state, action.cellId, action.index, {
          type: ContentType.TEXT,
          contentId: action.textId
        });
      case cellActionNames.INSERT_OUTPUT:
        return insert(state, action.cellId, action.index, {
          type: ContentType.OUTPUT,
          contentId: action.outputId
        });
      default:
        return state;
    }
  } else if (isCodeAction(action)) {
    switch (action.type) {
      case codeActionNames.INSERT_SNIPPET:
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
