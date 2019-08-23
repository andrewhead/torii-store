import * as actions from "../../../src/cells/actions";
import { cellActionNames as names } from "../../../src/cells/types";

describe("actions", () => {
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
