import * as cellActions from "../../src/cells/actions";
import * as codeActions from "../../src/code/actions";
import * as uiUndoableActions from "../../src/ui-undoable/actions";
import { uiUndoableReducer } from "../../src/ui-undoable/reducers";
import { createUndoable } from "../../src/util/test-utils";

describe("uiUndoableReducer", () => {
  describe("should handle SELECT_CELL", () => {
    it("should select a cell", () => {
      const state = createUndoable();
      expect(uiUndoableReducer(state, uiUndoableActions.selectCell("cell-id"))).toMatchObject({
        selectedCell: "cell-id"
      });
    });
  });

  describe("should handle CREATE_SNIPPET", () => {
    it("should select the created cell", () => {
      const state = createUndoable();
      const action = codeActions.createSnippet(undefined);
      expect(uiUndoableReducer(state, action)).toMatchObject({
        selectedCell: action.cellId
      });
    });
  });

  describe("should handle INSERT_OUTPUT", () => {
    it("should select the inserted cell", () => {
      const state = createUndoable();
      const action = cellActions.insertOutput(
        { snippetId: "snippet-id", commandId: "command-id" },
        undefined
      );
      expect(uiUndoableReducer(state, action)).toMatchObject({
        selectedCell: action.cellId
      });
    });
  });
});
