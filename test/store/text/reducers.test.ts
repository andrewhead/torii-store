import { Text } from "../../../src/text/types";
import { createSnippet } from "../../../src/text/actions";
import { textReducer } from "../../../src/text/reducers";
import { DeepPartial } from "redux";
import { visibility } from "../../../src/text/snippets/types";

function createText(partialState?: DeepPartial<Text>): Text {
  const emptyState = {
    snippets: { all: [], byId: {} },
    chunks: { all: [], byId: {} },
    chunkVersions: { all: [], byId: {} },
    visibilityRules: {}
  };
  return Object.assign({}, emptyState, partialState);
}

describe("text reducer", () => {
  describe("should handle CREATE_SNIPPET", () => {
    it("should create an empty snippet", () => {
      const text = createText();
      const action = createSnippet(0);
      expect(textReducer(text, action)).toMatchObject({
        snippets: {
          all: [action.id],
          byId: {
            [action.id]: { chunkVersionsAdded: [] }
          }
        }
      });
    });

    it("should insert the snippet", () => {
      const text = createText({
        snippets: {
          byId: {
            "other-snippet-id": {
              chunkVersionsAdded: []
            }
          },
          all: ["other-snippet-id"]
        }
      });
      const action = createSnippet(0);
      expect(textReducer(text, action)).toMatchObject({
        snippets: { all: [action.id, "other-snippet-id"] }
      });
    });

    it("should create new chunks", () => {
      const text = createText();
      const location = { path: "path", line: 0 };
      const action = createSnippet(0, [{ location, text: "Text" }]);
      const updatedState = textReducer(text, action);
      expect(updatedState.chunks.all.length).toEqual(1);
      expect(updatedState.chunkVersions.all.length).toEqual(1);
      const chunkId = updatedState.chunks.all[0];
      const chunkVersionId = updatedState.chunkVersions.all[0];
      expect(updatedState).toMatchObject({
        snippets: {
          byId: {
            [action.id]: {
              chunkVersionsAdded: [chunkVersionId]
            }
          }
        },
        chunks: {
          byId: {
            [chunkId]: {
              location,
              versions: [chunkVersionId]
            }
          },
          all: [chunkId]
        },
        chunkVersions: {
          byId: {
            [chunkVersionId]: {
              text: "Text",
              chunk: chunkId
            }
          },
          all: [chunkVersionId]
        }
      });
    });

    it("should hide ranges shown in earlier snippets", () => {
      const text = createText({
        snippets: {
          byId: {
            "other-snippet-id": {
              chunkVersionsAdded: ["other-chunk-version-id"]
            }
          },
          all: ["other-snippet-id"]
        },
        chunks: {
          byId: {
            "overlapping-chunk-id": {
              location: { path: "same-path", line: 1 },
              versions: ["other-chunk-version-id"]
            }
          },
          all: ["overlapping-chunk-id"]
        },
        chunkVersions: {
          byId: {
            "other-chunk-version-id": {
              chunk: "overlapping-chunk-id",
              text: "Line 1\nLine 2"
            }
          },
          all: ["other-chunk-version-id"]
        }
      });
      /*
       * Snippet intersects with last snippet: only include the new parts (Line 0). Show the old
       * parts (Line 1).
       */
      const action = createSnippet(1, [
        {
          location: { path: "same-path", line: 0 },
          text: "Line 0\nLine 1"
        }
      ]);
      const updatedState = textReducer(text, action);
      const chunkVersionId = updatedState.snippets.byId[action.id].chunkVersionsAdded[0];
      expect(updatedState).toMatchObject({
        chunkVersions: {
          byId: {
            [chunkVersionId]: {
              text: "Line 0"
            }
          }
        },
        visibilityRules: {
          [action.id]: {
            "other-chunk-version-id": {
              1: visibility.VISIBLE
            }
          }
        }
      });
    });

    it("does not add new chunks if all text was included before", () => {

    });

    it("splits old chunks", () => {

    });

    /**
     * Cases to additionally test:
     * - not splitting a later chunk that has a v2 (ignoring that part of the chunk)
     */
  });
});

/*
describe("should handle CREATE_LINE", () => {
  it("should add a line", () => {
    const linesById = {};
    const action = createLine(LINE_LOCATION);
    expect(linesByIdReducer(linesById, action)).toEqual({
      [action.id]: {
        location: LINE_LOCATION,
        versions: []
      }
    });
  });

  it("should add the line's initial version", () => {
    const linesById = {};
    const initialVersionText = "Initial version text";
    const action = createLine(LINE_LOCATION, initialVersionText);
    expect(linesByIdReducer(linesById, action)).toMatchObject({
      [action.id]: {
        versions: [action.initialVersionId]
      }
    });
  });
  */

/*
describe("undoable reducer", () => {

  const initialState: UndoableState = {

  }

  describe("should handle EDIT", () => {
    it("should edit a chunk's text", () => {
      expect(true).toBe(false);
    });

    it("should edit the intersecting range", () => {
      expect(true).toBe(false);
    });

    describe("should merge chunks", () => {
      // This logic will be reused when chunks are added to a snippet AND when an edit takes place.
      // Should have tests of its own
      // There should also be helpers for splitting chunks---when a line is removed
      it("should merge two adjacent chunks", () => {});

      it("should make a new version if only one chunk is updated", () => {
        expect(true).toBe(false);
      });

      it("should make a new version from two updated versions", () => {
        expect(true).toBe(false);
      });
    });

    it("should merge chunks", () => {
      // Will only happen if a line was removed between two chunks... this is a cleanup step.
      // Can order all of the lines, merge any two that don't look the same.
      // Merge needs to take place for all future versions of the code too.
      // New chunk version IDs and chunk IDs should be created.
      expect(true).toBe(false);
    });

    it("should move other chunks", () => {
      expect(true).toBe(false);
    });
  });
});
*/
