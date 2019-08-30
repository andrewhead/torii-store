import * as actions from "../../src/texts/actions";
import { textActionNames as names } from "../../src/texts/types";

describe("actions", () => {
  it("should create an action for setting text", () => {
    const id = "text-id";
    const value = "New text";
    const expectedAction = {
      id,
      value,
      type: names.SET_TEXT
    };
    expect(actions.setText(id, value)).toEqual(expectedAction);
  });
});
