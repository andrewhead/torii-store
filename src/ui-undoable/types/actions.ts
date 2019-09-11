import { AnyAction } from "redux";
import { CellId } from "../../cells/types";
import * as names from "./action-names";

export interface SelectCellAction {
  type: typeof names.SELECT_CELL;
  id: CellId | undefined;
}

export type UiUndoableActionTypes = SelectCellAction;

export function isUiUndoableAction(action: AnyAction): action is UiUndoableActionTypes {
  return Object.keys(names).indexOf(action.type) !== -1;
}
