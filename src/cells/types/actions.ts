import { AnyAction } from "redux";
import { OutputId } from "../../outputs/types";
import { TextId } from "../../texts/types";
import * as names from "./action-names";
import { CellId } from "./cell";

export interface InsertTextAction {
  type: typeof names.INSERT_TEXT;
  cellId: CellId;
  textId: TextId;
  index: number;
}

export interface InsertOutputAction {
  type: typeof names.INSERT_OUTPUT;
  cellId: CellId;
  outputId: OutputId;
  index: number;
}

export interface MoveCellAction {
  type: typeof names.MOVE_CELL;
  id: CellId;
  to: number;
}

export type CellActionTypes = InsertTextAction | InsertOutputAction | MoveCellAction;

export function isCellAction(action: AnyAction): action is CellActionTypes {
  return Object.keys(names).indexOf(action.type) !== -1;
}
