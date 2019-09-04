import * as actions from "../../src/state/actions";
import { stateReducer } from "../../src/state/reducers";
import { createStateWithUndoable } from "../../src/util/test-utils";

describe("state reducer", () => {
  describe("should handle SET_STATE", () => {
    it("should set the state", () => {
      const state = createStateWithUndoable({});
      const newState = createStateWithUndoable({
        selectedCell: "selected-cell-id"
      });
      expect(stateReducer(state, actions.setState(newState))).toMatchObject(newState);
    });
  });
});
