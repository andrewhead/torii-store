import { cellsReducer } from "../../../src/cells/reducers";
import { ContentType } from "../../../src/cells/types";
import * as textActions from "../../../src/text/actions";
import { createUndoable } from "../../../src/util/test-utils";

describe("cellsReducers", () => {
  describe("should handle CREATE_SNIPPET", () => {
    it("should create a cell for the snippet", () => {
      const text = createUndoable();
      const action = textActions.createSnippet(0);
      expect(cellsReducer(text, action)).toMatchObject({
        cells: {
          all: [action.cellId],
          byId: {
            [action.cellId]: {
              contentId: action.snippetId,
              type: ContentType.SNIPPET
            }
          }
        }
      });
    });

    it("should insert the snippet", () => {
      const undoable = createUndoable({
        cells: {
          byId: {
            "other-cell-id": {
              contentId: "other-snippet-id",
              type: ContentType.SNIPPET
            }
          },
          all: ["other-cell-id"]
        }
      });
      const action = textActions.createSnippet(0);
      expect(cellsReducer(undoable, action)).toMatchObject({
        cells: { all: [action.cellId, "other-cell-id"] }
      });
    });
  });
});
