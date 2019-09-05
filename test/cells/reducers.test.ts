import * as cellActions from "../../src/cells/actions";
import { cellsReducer } from "../../src/cells/reducers";
import { CellId, ContentType } from "../../src/cells/types";
import * as codeActions from "../../src/code/actions";
import { OutputId } from "../../src/outputs/types";
import { createChunks, createUndoable } from "../../src/util/test-utils";

describe("cellsReducers", () => {
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

  describe("should handle INSERT_TEXT", () => {
    it("should insert a text", () => {
      const state = createUndoableWithCells("cell-0");
      const action = cellActions.insertText(0);
      expect(cellsReducer(state, action)).toMatchObject({
        cells: {
          all: [action.cellId, "cell-0"],
          byId: {
            [action.cellId]: {
              contentId: action.textId
            }
          }
        }
      });
    });
  });

  describe("should handle INSERT_OUTPUT", () => {
    it("should insert an output", () => {
      const state = createUndoableWithCells("cell-0");
      const outputId: OutputId = {
        snippetId: "snippet-id",
        commandId: "command-id"
      };
      const action = cellActions.insertOutput(0, outputId);
      expect(cellsReducer(state, action)).toMatchObject({
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
});

describe("should handle DELETE", () => {
  it("should delete a cell", () => {
    const state = createChunks(
      { cellId: "cell-0", snippetId: "snippet-0" },
      { cellId: "cell-1", snippetId: "snippet-1" }
    );
    const updatedState = cellsReducer(
      state,
      cellActions.deleteCell("cell-0", ContentType.SNIPPET, "snippet-0")
    );
    expect(updatedState.cells.all).toEqual(["cell-1"]);
    expect(Object.keys(updatedState.cells.byId)).toEqual(["cell-1"]);
  });
});

function createUndoableWithCells(...cellIds: CellId[]) {
  const undoable = createUndoable();
  for (let i = 0; i < cellIds.length; i++) {
    const cellId = cellIds[i];
    undoable.cells.all.push(cellId);
    undoable.cells.byId[cellId] = {
      type: ContentType.SNIPPET,
      contentId: "mock-content-id-" + i
    };
  }
  return undoable;
}
