import { AnyAction } from "redux";
import { OutputId } from "../../outputs/types";
import { TextId } from "../../texts/types";
import * as names from "./action-names";
import { CellId, ContentType } from "./cell";

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

export interface MoveAction {
  type: typeof names.MOVE;
  id: CellId;
  to: number;
}

export interface DeleteAction {
  type: typeof names.DELETE;
  id: CellId;
  contentType: ContentType;
  contentId: any;
}

export type CellActionTypes = InsertTextAction | InsertOutputAction | MoveAction | DeleteAction;

export function isCellAction(action: AnyAction): action is CellActionTypes {
  return Object.keys(names).indexOf(action.type) !== -1;
}
