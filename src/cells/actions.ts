import uuidv4 from "uuid/v4";
import { OutputId } from "../outputs/types";
import { cellActionNames as names, CellId, InsertOutputAction, MoveCellAction } from "./types";

export function insertOutput(outputId: OutputId, index: number): InsertOutputAction {
  return {
    outputId,
    index,
    cellId: uuidv4(),
    type: names.INSERT_OUTPUT
  };
}

export function move(id: CellId, to: number): MoveCellAction {
  return {
    id,
    to,
    type: names.MOVE_CELL
  };
}
