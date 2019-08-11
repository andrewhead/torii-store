import * as actions from "../../../src/text/actions";
import * as names from "../../../src/text/action-names";

describe("actions", () => {
  it("should create an action for creating snippets", () => {
    const index = 0;
    const expectedAction = {
      index,
      chunks: [],
      type: names.CREATE_SNIPPET
    }
    expect(actions.createSnippet(index)).toMatchObject(expectedAction);
  });

  /*
  it("should create an action for editing", () => {
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 5 }};
    const path = "filename";
    const text = "Updated text";
    const expectedAction = {
      edit: { path, range, newText: text },
      type: names.EDIT
    };
    expect(actions.edit(path, range, text)).toEqual(expectedAction);
  });
  */
});