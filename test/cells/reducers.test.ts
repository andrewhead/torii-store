import * as cellActions from "../../src/cells/actions";
import { cellsReducer } from "../../src/cells/reducers";
import { ContentType } from "../../src/cells/types";
import * as codeActions from "../../src/code/actions";
import { OutputId } from "../../src/outputs/types";
import { createUndoable } from "../../src/util/test-utils";

describe("cellsReducers", () => {
  describe("should handle INSERT_OUTPUT", () => {
    it("should insert an output", () => {
      const code = createUndoable({
        cells: {
          all: ["cell-0"],
          byId: {
            "cell-0": {
              type: ContentType.SNIPPET,
              contentId: "mock-snippet-id"
            }
          }
        }
      });
      const outputId: OutputId = {
        snippetId: "snippet-id",
        commandId: "command-id"
      };
      const action = cellActions.insertOutput(0, outputId);
      expect(cellsReducer(code, action)).toMatchObject({
        cells: {
          all: [action.cellId, "cell-0"],
          byId: {
            [action.cellId]: {
              type: ContentType.OUTPUT,
              contentId: outputId
            }
          }
        }
      });
    });
  });

  describe("should handle INSERT_SNIPPET", () => {
    it("should create a cell for the snippet", () => {
      const code = createUndoable();
      const action = codeActions.insertSnippet(0);
      expect(cellsReducer(code, action)).toMatchObject({
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
      const action = codeActions.insertSnippet(0);
      expect(cellsReducer(undoable, action)).toMatchObject({
        cells: { all: [action.cellId, "other-cell-id"] }
      });
    });
  });
});
