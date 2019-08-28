import * as actions from "../../src/cells/actions";
import { cellActionNames as names } from "../../src/cells/types";
import { OutputId } from "../../src/outputs/types";

describe("actions", () => {
  it("should create an action for inserting an output", () => {
    const outputId: OutputId = {
      snippetId: "snippet-id",
      commandId: "command-id"
    };
    const index = 1;
    const action = actions.insertOutput(outputId, index);
    expect(action).toMatchObject({ outputId, index });
    expect(action.cellId).not.toBe(undefined);
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
