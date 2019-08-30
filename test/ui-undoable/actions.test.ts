import * as actions from "../../src/ui-undoable/actions";
import { uiUndoableActionNames as names } from "../../src/ui-undoable/types";

describe("actions", () => {
  it("should create an action for selecting a cell", () => {
    const id = "cell-id";
    const expectedAction = {
      id,
      type: names.SELECT_CELL
    };
    expect(actions.selectCell(id)).toEqual(expectedAction);
  });
});
