import * as uiUndoableActions from "../../src/ui-undoable/actions";
import { uiUndoableReducer } from "../../src/ui-undoable/reducers";
import { createUndoable } from "../../src/util/test-utils";

describe("uiUndoableReducer", () => {
  describe("should handle SELECT_CELL", () => {
    it("should select a cell", () => {
      const state = createUndoable();
      expect(uiUndoableReducer(state, uiUndoableActions.selectCell("cell-id"))).toMatchObject({
        selection: "cell-id"
      });
    });
  });
});
