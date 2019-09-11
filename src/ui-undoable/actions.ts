import { CellId } from "../cells/types";
import { SelectCellAction, uiUndoableActionNames as names } from "./types";

export function selectCell(id: CellId | undefined): SelectCellAction {
  return {
    id,
    type: names.SELECT_CELL
  };
}
