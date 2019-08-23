import { AnyAction } from "redux";
import * as names from "./action-names";
import { CellId } from "./cell";

export interface MoveCellAction {
  type: typeof names.MOVE_CELL;
  id: CellId;
  to: number;
}

export type CellActionTypes = MoveCellAction;

export function isCellAction(action: AnyAction): action is CellActionTypes {
  return (action as CellActionTypes).type !== undefined;
}
