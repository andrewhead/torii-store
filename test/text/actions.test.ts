import * as actions from "../../src/text/actions";
import {
  ReferenceImplementationSource,
  Selection,
  SourceType,
  textActionNames as names
} from "../../src/text/types";

describe("actions", () => {
  it("should create an action for uploading file contents", () => {
    const contents = "File contents";
    const path = "file-path";
    const expectedAction = {
      contents,
      path,
      type: names.UPLOAD_FILE_CONTENTS
    };
    const action = actions.uploadFileContents(path, contents);
    expect(action).toMatchObject(expectedAction);
    expect(action.chunkId).not.toBe(undefined);
    expect(action.chunkVersionId).not.toBe(undefined);
  });

  it("should create an action for creating snippets", () => {
    const index = 0;
    const expectedAction = {
      index,
      chunks: [],
      type: names.CREATE_SNIPPET
    };
    expect(actions.createSnippet(index)).toMatchObject(expectedAction);
  });

  it("should create an action for setting selection", () => {
    const selections: Selection[] = [
      {
        anchor: { line: 1, character: 0 },
        active: { line: 1, character: 2 },
        path: "file-path",
        relativeTo: { source: SourceType.REFERENCE_IMPLEMENTATION }
      }
    ];
    const expectedAction = {
      selections,
      type: names.SET_SELECTIONS
    };
    expect(actions.setSelections(...selections)).toEqual(expectedAction);
  });

  it("should create an action for editing", () => {
    const range = {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 5 },
      path: "file-path",
      relativeTo: { source: SourceType.REFERENCE_IMPLEMENTATION } as ReferenceImplementationSource
    };
    const text = "Updated text";
    const expectedAction = {
      edit: { range, newText: text },
      type: names.EDIT
    };
    expect(actions.edit(range, text)).toEqual(expectedAction);
  });
});
