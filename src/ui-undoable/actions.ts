import { CellId } from "../cells/types";
import { SelectCellAction, uiUndoableActionNames as names } from "./types";

export function selectCell(id: CellId): SelectCellAction {
  return {
    id,
    type: names.SELECT_CELL
  };
}
