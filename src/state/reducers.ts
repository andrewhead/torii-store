import reduceReducers from "reduce-reducers";
import { AnyAction, combineReducers } from "redux";
import undoable, { excludeAction, groupByActionTypes } from "redux-undo";
import { cellsReducer } from "../cells/reducers";
import { cellActionNames } from "../cells/types";
import { codeReducer } from "../code/reducers";
import { codeActionNames } from "../code/types";
import { outputsReducer } from "../outputs/reducers";
import { outputActionNames } from "../outputs/types";
import { textsReducer } from "../texts/reducers";
import { textActionNames } from "../texts/types";
import { uiUndoableReducer } from "../ui-undoable/reducers";
import { uiUndoableActionNames } from "../ui-undoable/types";
import { isStateAction, State, stateActionNames } from "./types";

/**
 * Number of undo's stored in the history. This is a small number of steps, and could probably
 * be increased if undo's were stored as deltas, and not snapshots. In addition, it might
 * be increased if some actions are filtered out from creating new snapshots (e.g., selections).
 */
const UNDO_LIMIT = 20;

const undoableReducers = [uiUndoableReducer, codeReducer, textsReducer, cellsReducer];
const undoableReducer = undoable(reduceReducers(...undoableReducers), {
  limit: UNDO_LIMIT,
  groupBy: groupByActionTypes([
    codeActionNames.EDIT,
    cellActionNames.MOVE,
    textActionNames.SET_TEXT,
    /*
     * Don't ignore SELECT_CELL, as it can be used to delimit edits in different editors.
     */
    uiUndoableActionNames.SELECT_CELL
  ]),
  filter: excludeAction([
    codeActionNames.UPLOAD_FILE_CONTENTS,
    codeActionNames.SET_SELECTIONS,
    outputActionNames.START_EXECUTION,
    outputActionNames.UPDATE_EXECUTION,
    outputActionNames.FINISH_EXECUTION
  ])
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
