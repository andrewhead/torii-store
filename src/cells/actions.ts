import { cellActionNames as names, CellId, MoveCellAction } from "./types";

export function move(id: CellId, to: number): MoveCellAction {
  return {
    id,
    to,
    type: names.MOVE_CELL
  };
}
