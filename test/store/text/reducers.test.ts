import { Text } from "../../../src/text/types";
import { createSnippet } from "../../../src/text/actions";
import { textReducer } from "../../../src/text/reducers";
import { DeepPartial } from "redux";
import { visibility, SnippetId } from "../../../src/text/snippets/types";
import { ChunkVersionId, ChunkId, Location } from "../../../src/text/chunks/types";
import uuidv4 from "uuid/v4";

function createText(partialState?: DeepPartial<Text>): Text {
  const emptyState = {
    snippets: { all: [], byId: {} },
    chunks: { all: [], byId: {} },
    chunkVersions: { all: [], byId: {} },
    visibilityRules: {}
  };
  return Object.assign({}, emptyState, partialState);
}

function createTextWithSnippets(
  snippetId: SnippetId,
  chunkId: ChunkId,
  chunkVersionId: ChunkVersionId,
  location: Location,
  text: string
) {
  return createText({
    snippets: {
      byId: {
        [snippetId]: {
          chunkVersionsAdded: [chunkVersionId]
        }
      },
      all: [snippetId]
    },
    chunks: {
      byId: {
        [chunkId]: {
          location: location,
          versions: [chunkVersionId]
        }
      },
      all: [chunkId]
    },
    chunkVersions: {
      byId: {
        [chunkVersionId]: {
          chunk: chunkId,
          text
        }
      },
      all: [chunkVersionId]
    }
  });
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
      const location = { path: "path", line: 1 };
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
      const text = createTextWithSnippets(
        "snippet-id",
        "overlapping-chunk-id",
        "other-chunk-version-id",
        { path: "same-path", line: 2 },
        "Line 1\nLine 2"
      );
      /*
       * Snippet intersects with last snippet: only include the new parts (Line 0). Show the old
       * parts (Line 1).
       */
      const action = createSnippet(1, [
        {
          location: { path: "same-path", line: 1 },
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
              2: visibility.VISIBLE
            }
          }
        }
      });
    });

    it("does not add new chunks if all text was included before", () => {
      const text = createTextWithSnippets(
        "snippet-id",
        "overlapping-chunk-id",
        "other-chunk-version-id",
        { path: "same-path", line: 1 },
        "Line 1\nLine 2"
      );
      /*
       * Snippet intersects completely with last snippet: Don't add a new snippet.
       */
      const action = createSnippet(1, [
        {
          location: { path: "same-path", line: 1 },
          text: "Line 1\nLine 2"
        }
      ]);
      const updatedState = textReducer(text, action);
      expect(updatedState.chunks.all.length).toBe(1);
      expect(updatedState.chunkVersions.all.length).toBe(1);
    });

    function snippetContainingText(state: Text, text: string) {
      for (let snippetIndex = 0; snippetIndex < state.snippets.all.length; snippetIndex++) {
        const snippet = state.snippets.byId[state.snippets.all[snippetIndex]];
        for (const chunkVersionId of snippet.chunkVersionsAdded) {
          if (state.chunkVersions.byId[chunkVersionId].text === text) {
            return snippetIndex;
          }
        }
      }
      return -1;
    }

    it("splits old chunks", () => {
      const text = createTextWithSnippets(
        "snippet-id",
        "overlapping-chunk-id",
        "other-chunk-version-id",
        { path: "same-path", line: 1 },
        "Line 1\nLine2\nLine 3"
      );
      /**
       * Snippet interesects the middle of the snippet that comes after it. Split the snippet that
       * comes after, while making sure that the lines still appear in it.
       */
      const action = createSnippet(0, [
        {
          location: { path: "same-path", line: 2 },
          text: "Line 2"
        }
      ]);
      const updatedState = textReducer(text, action);
      expect(snippetContainingText(updatedState, "Line 1")).toBe(1);
      expect(snippetContainingText(updatedState, "Line 2")).toBe(0);
      expect(snippetContainingText(updatedState, "Line 3")).toBe(1);
      const newSnippetId = action.id;
      for (const movedChunkVersionId of updatedState.snippets.byId[newSnippetId].chunkVersionsAdded) {
        expect(updatedState.visibilityRules).toMatchObject({
          ["snippet-id"]: {
            [movedChunkVersionId]: {
              0: visibility.VISIBLE
            }
          }
        });
      }
    });

    it("removes chunks when all its lines are added to an earlier snippet", () => {
      const text = createTextWithSnippets(
        "snippet-id",
        "overlapping-chunk-id",
        "other-chunk-version-id",
        { path: "same-path", line: 1 },
        "Line 1"
      );
      const action = createSnippet(0, [
        {
          location: { path: "same-path", line: 1 },
          text: "Line 1"
        }
      ]);
      const updatedState = textReducer(text, action);
      const newSnippet = updatedState.snippets.byId[action.id];
      const newChunkVersion = updatedState.chunkVersions.byId[newSnippet.chunkVersionsAdded[0]];
      const newChunkId = newChunkVersion.chunk;
      expect(updatedState.chunks.all).toEqual([newChunkId]);
    });

    /*
    it("throws an error when splitting a snippet with 2+ versions", () => {

    });
    */
  });
});

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
