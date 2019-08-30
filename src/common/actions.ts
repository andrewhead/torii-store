import { CellInsertLocation } from "./types";

export function insertIndex(location: CellInsertLocation): number {
  if (typeof location === "number") {
    return location;
  }
  const state = location;
  const { selectedCell, cells } = state.undoable.present;
  if (selectedCell === undefined) {
    return 0;
  }
  return cells.all.indexOf(selectedCell) + 1;
}
