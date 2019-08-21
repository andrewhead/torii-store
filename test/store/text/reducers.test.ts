import * as actions from "../../../src/text/actions";
import { textReducer } from "../../../src/text/reducers";
import { visibility } from "../../../src/text/snippets/types";
import { ReferenceImplementationSource, SourceType, Text } from "../../../src/text/types";
import { createSnippetWithChunkVersions } from "../../../src/util/test-utils";
import * as textUtils from "../../../src/util/text-utils";
import { createText, createTextWithSnippets } from "./util";

describe("text reducer", () => {
  describe("should handle CREATE_SNIPPET", () => {
    it("should create an empty snippet", () => {
      const text = createText();
      const action = actions.createSnippet(0);
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
      const action = actions.createSnippet(0);
      expect(textReducer(text, action)).toMatchObject({
        snippets: { all: [action.id, "other-snippet-id"] }
      });
    });

    it("should create new chunks", () => {
      const text = createText();
      const location = { path: "path", line: 1 };
      const action = actions.createSnippet(0, { location, text: "Text" });
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
      const action = actions.createSnippet(1, {
        location: { path: "same-path", line: 1 },
        text: "Line 0\nLine 1"
      });
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
      const action = actions.createSnippet(1, {
        location: { path: "same-path", line: 1 },
        text: "Line 1\nLine 2"
      });
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
      const action = actions.createSnippet(0, {
        location: { path: "same-path", line: 2 },
        text: "Line 2"
      });
      const updatedState = textReducer(text, action);
      expect(snippetContainingText(updatedState, "Line 1")).toBe(1);
      expect(snippetContainingText(updatedState, "Line 2")).toBe(0);
      expect(snippetContainingText(updatedState, "Line 3")).toBe(1);
      const newSnippetId = action.id;
      for (const movedChunkVersionId of updatedState.snippets.byId[newSnippetId]
        .chunkVersionsAdded) {
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
      const action = actions.createSnippet(0, {
        location: { path: "same-path", line: 1 },
        text: "Line 1"
      });
      const updatedState = textReducer(text, action);
      const newSnippet = updatedState.snippets.byId[action.id];
      const newChunkVersion = updatedState.chunkVersions.byId[newSnippet.chunkVersionsAdded[0]];
      const newChunkId = newChunkVersion.chunk;
      expect(updatedState.chunks.all).toEqual([newChunkId]);
    });

    /*
     * TODO(andrewhead): Add to errors. textReducer should take in two slices of state: text, and
     * errors. It returns new versions of both slices.
     */
    // it("throws an error when splitting a snippet with 2+ versions", () => {});
  });

  describe("should handle SET_SELECTIONS", () => {
    const text = createText();
    const selection = {
      anchor: { line: 1, character: 0 },
      active: { line: 1, character: 2 },
      path: "file-path",
      relativeTo: { source: SourceType.REFERENCE_IMPLEMENTATION } as ReferenceImplementationSource
    };
    expect(textReducer(text, actions.setSelections(selection))).toMatchObject({
      selections: [selection]
    });
  });

  describe("should handle EDIT", () => {
    it("should edit a chunk's text", () => {
      const text = createSnippetWithChunkVersions({
        id: "chunk-version-0",
        line: 1,
        text: "Line 1"
      });
      const newText = "2";
      const range = {
        start: { line: 1, character: 5 },
        end: { line: 1, character: 6 },
        path: "file-path",
        relativeTo: { source: SourceType.CHUNK_VERSION, chunkVersionId: "chunk-version-0" }
      };
      expect(textReducer(text, actions.edit(range, newText))).toMatchObject({
        chunkVersions: {
          byId: {
            "chunk-version-0": {
              text: "Line 2"
            }
          }
        }
      });
    });

    it("should edit chunks intersecting with the reference implementation", () => {
      const text = createSnippetWithChunkVersions({
        id: "chunk-version-0",
        line: 3,
        text: "Line 1"
      });
      const newText = "2";
      const range = {
        start: { line: 3, character: 5 },
        end: { line: 3, character: 6 },
        path: "file-path",
        relativeTo: { source: SourceType.REFERENCE_IMPLEMENTATION } as ReferenceImplementationSource
      };
      expect(textReducer(text, actions.edit(range, newText))).toMatchObject({
        chunkVersions: {
          byId: {
            "chunk-version-0": {
              text: "Line 2"
            }
          }
        }
      });
    });

    it("should not edit chunk versions that are not chunk version 0", () => {
      const text = createSnippetWithChunkVersions(
        {
          id: "chunk-version-0",
          chunkId: "chunk-0",
          line: 3,
          text: "Line 1A"
        },
        {
          id: "chunk-version-1",
          chunkId: "chunk-0",
          line: 3,
          text: "Line 1B"
        }
      );
      const newText = "2";
      const range = {
        start: { line: 3, character: 5 },
        end: { line: 3, character: 6 },
        path: "file-path",
        relativeTo: { source: SourceType.REFERENCE_IMPLEMENTATION } as ReferenceImplementationSource
      };
      /**
       * The second chunk version, even though it's at the same position, shouldn't be changed.
       * Only the first chunk version should change when the reference implementation changes.
       */
      expect(textReducer(text, actions.edit(range, newText))).toMatchObject({
        chunkVersions: {
          byId: {
            "chunk-version-1": {
              text: "Line 1B"
            }
          }
        }
      });
    });

    describe("should merge chunks", () => {
      it("should merge two adjacent chunks when separator is deleted", () => {
        // TODO(andrewhead)
      });

      it("should not merge if there is a later version of the chunks", () => {
        // TODO(andrewhead)
      });
    });

    it("should move other chunks when the reference implementation changes", () => {
      const text = createSnippetWithChunkVersions({
        chunkId: "chunk-0",
        line: 3,
        text: "Line 1"
      });
      const range = {
        start: { line: 1, character: 0 },
        end: { line: 1, character: 0 },
        path: "file-path",
        relativeTo: { source: SourceType.REFERENCE_IMPLEMENTATION } as ReferenceImplementationSource
      };
      const newText = textUtils.join("", ""); // replacement text contains extra newline.
      expect(textReducer(text, actions.edit(range, newText))).toMatchObject({
        chunks: {
          byId: {
            "chunk-0": {
              /**
               * Chunk has moved forward one line because a newline has been inserted before it.
               */
              location: { line: 4 }
            }
          }
        }
      });
    });

    it("should move other chunks when a chunk version changes", () => {
      const text = createSnippetWithChunkVersions(
        {
          id: "chunk-version-0",
          line: 1,
          text: "Line 1"
        },
        {
          chunkId: "chunk-1",
          line: 3,
          text: "Line 3"
        }
      );
      const range = {
        start: { line: 1, character: 0 },
        end: { line: 1, character: 0 },
        path: "file-path",
        relativeTo: { source: SourceType.CHUNK_VERSION, chunkVersionId: "chunk-version-0" }
      };
      const newText = textUtils.join("", ""); // replacement text contains extra newline.
      expect(textReducer(text, actions.edit(range, newText))).toMatchObject({
        chunks: {
          byId: {
            "chunk-1": {
              location: { line: 4 }
            }
          }
        }
      });
    });
  });
});
