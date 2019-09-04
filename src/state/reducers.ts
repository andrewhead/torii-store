import reduceReducers from "reduce-reducers";
import { AnyAction, combineReducers } from "redux";
import undoable from "redux-undo";
import { cellsReducer } from "../cells/reducers";
import { codeReducer } from "../code/reducers";
import { outputsReducer } from "../outputs/reducers";
import { textsReducer } from "../texts/reducers";
import { uiUndoableReducer } from "../ui-undoable/reducers";
import { isStateAction, State, stateActionNames } from "./types";

/**
 * Number of undo's stored in the history. This is a small number of steps, and could probably
 * be increased if undo's were stored as deltas, and not snapshots. In addition, it might
 * be increased if some actions are filtered out from creating new snapshots (e.g., selections).
 */
const UNDO_LIMIT = 10;

const undoableReducers = [uiUndoableReducer, codeReducer, textsReducer, cellsReducer];
const undoableReducer = undoable(reduceReducers(...undoableReducers), {
  limit: UNDO_LIMIT
});

export const sliceReducer = combineReducers({
  outputs: outputsReducer,
  undoable: undoableReducer
});

export const rootReducer = reduceReducers(stateReducer, sliceReducer);

export function stateReducer(state = undefined, action: AnyAction): State {
  if (isStateAction(action)) {
    switch (action.type) {
      case stateActionNames.SET_STATE:
        return action.state;
      default:
        return state;
    }
  }
  return state;
}
