import * as actions from "../../src/state/actions";
import { stateActionNames as names } from "../../src/state/types";
import { createStateWithUndoable } from "../../src/util/test-utils";

describe("actions", () => {
  it("should create an action for setting state", () => {
    const state = createStateWithUndoable({});
    const expectedAction = {
      state,
      type: names.SET_STATE
    };
    expect(actions.setState(state)).toEqual(expectedAction);
  });
});
