import uuidv4 from "uuid/v4";
import { insertIndex } from "../common/actions";
import { CellInsertLocation } from "../common/types";
import { OutputId } from "../outputs/types";
import { State } from "../state/types";
import {
  cellActionNames as names,
  CellId,
  ContentType,
  InsertOutputAction,
  InsertTextAction,
  MoveAction
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

export function move(id: CellId, to: number): MoveAction {
  return {
    id,
    to,
    type: names.MOVE
  };
}

/**
 * Action creator must know the type and ID of the content contained in the cell, so it can remove
 * that content if there are no remaining references to it.
 */
export function deleteCell(id: CellId, contentType: ContentType, contentId: any) {
  return {
    id,
    contentType,
    contentId,
    type: names.DELETE
  };
}
