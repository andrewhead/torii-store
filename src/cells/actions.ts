import uuidv4 from "uuid/v4";
import { State } from "..";
import { insertIndex } from "../common/actions";
import { CellInsertLocation } from "../common/types";
import { OutputId } from "../outputs/types";
import {
  cellActionNames as names,
  CellId,
  InsertOutputAction,
  InsertTextAction,
  MoveCellAction
} from "./types";

export function insertOutput(state: State, outputId: OutputId): InsertOutputAction;
export function insertOutput(index: number, outputId: OutputId): InsertOutputAction;
export function insertOutput(location: CellInsertLocation, outputId: OutputId): InsertOutputAction {
  return {
    outputId,
    index: insertIndex(location),
    cellId: uuidv4(),
    type: names.INSERT_OUTPUT
  };
}

export function insertText(state: State): InsertTextAction;
export function insertText(index: number): InsertTextAction;
export function insertText(location: CellInsertLocation): InsertTextAction {
  return {
    index: insertIndex(location),
    textId: uuidv4(),
    cellId: uuidv4(),
    type: names.INSERT_TEXT
  };
}

export function move(id: CellId, to: number): MoveCellAction {
  return {
    id,
    to,
    type: names.MOVE_CELL
  };
}
