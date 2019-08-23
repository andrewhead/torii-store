import { AnyAction } from "redux";
import { move } from "../common/reducers";
import { initialUndoableState } from "../types";
import { cellActionNames as actionNames, isCellAction } from "./types";

export function cellsReducer(state = initialUndoableState, action: AnyAction) {
  if (isCellAction(action)) {
    switch (action.type) {
      case actionNames.MOVE_CELL:
        return move(state.cells, action.id, action.to);
    }
  }
  return state;
}
