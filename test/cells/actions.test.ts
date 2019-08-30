import * as actions from "../../src/cells/actions";
import { cellActionNames as names, ContentType } from "../../src/cells/types";
import { OutputId } from "../../src/outputs/types";
import { createStateWithUndoable } from "../../src/util/test-utils";

describe("actions", () => {
  describe("should create an action for inserting an output", () => {
    it("at an index", () => {
      const outputId: OutputId = {
        snippetId: "snippet-id",
        commandId: "command-id"
      };
      const index = 1;
      const action = actions.insertOutput(index, outputId);
      expect(action).toMatchObject({ outputId, index });
      expect(action.cellId).not.toBe(undefined);
    });

    it("after the selected cell", () => {
      const state = createStateWithUndoable({
        selectedCell: "cell-0",
        cells: {
          all: ["cell-0"],
          byId: { "cell-0": { contentId: "snippet-id", type: ContentType.SNIPPET } }
        }
      });
      const outputId: OutputId = {
        snippetId: "snippet-id",
        commandId: "command-id"
      };
      const action = actions.insertOutput(state, outputId);
      expect(action).toMatchObject({ outputId, index: 1 });
    });
  });

  it("should create an action for moving a cell", () => {
    const id = "cell-id";
    const to = 2;
    const expectedAction = {
      id,
      to,
      type: names.MOVE_CELL
    };
    expect(actions.move(id, to)).toEqual(expectedAction);
  });
});
