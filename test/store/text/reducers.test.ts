import { ContentType } from "../../../src";
import * as actions from "../../../src/text/actions";
import { textReducer } from "../../../src/text/reducers";
import {
  ReferenceImplementationSource,
  SnippetId,
  SourceType,
  visibility
} from "../../../src/text/types";
import { Undoable } from "../../../src/types";
import {
  createSnippetWithChunkVersions,
  createUndoable,
  createUndoableWithSnippet
} from "../../../src/util/test-utils";
import * as textUtils from "../../../src/util/text-utils";

describe("text reducer", () => {
  describe("should handle UPLOAD_FILE_CONTENTS", () => {
    it("should create a chunk with the file contents", () => {
      const path = "file-path";
      const text = createUndoable();
      const action = actions.uploadFileContents(path, "File contents");
      expect(textReducer(text, action)).toMatchObject({
        chunks: {
          all: [action.chunkId],
          byId: {
            [action.chunkId]: {
              location: { line: 1, path },
              versions: [action.chunkVersionId]
            }
          }
        },
        chunkVersions: {
          all: [action.chunkVersionId],
          byId: {
            [action.chunkVersionId]: {
              chunk: action.chunkId,
              text: "File contents"
            }
          }
        }
      });
      expect(text.snippets.all.length).toBe(0);
    });
  });

  describe("should handle CREATE_SNIPPET", () => {
    it("should create an empty snippet", () => {
      const text = createUndoable();
      const action = actions.createSnippet(0);
      expect(textReducer(text, action)).toMatchObject({
        snippets: {
          all: [action.snippetId],
          byId: {
            [action.snippetId]: { chunkVersionsAdded: [] }
          }
        }
      });
    });

    describe("should create new chunks", () => {
      const text = createUndoable();
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
            [action.snippetId]: {
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
      const text = createUndoableWithSnippet(
        "cell-id",
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
      const chunkVersionId = updatedState.snippets.byId[action.snippetId].chunkVersionsAdded[0];
      expect(updatedState).toMatchObject({
        chunkVersions: {
          byId: {
            [chunkVersionId]: {
              text: "Line 0"
            }
          }
        },
        visibilityRules: {
          [action.snippetId]: {
            "other-chunk-version-id": {
              2: visibility.VISIBLE
            }
          }
        }
      });
    });

    it("does not add new chunks if all text was included before", () => {
      const text = createUndoableWithSnippet(
        "cell-id",
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

    describe("splits other chunks", () => {
      it("from other snippets", () => {
        const text = createUndoableWithSnippet(
          "cell-id",
          "first-snippet-id",
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
        expect(snippetContainingText(updatedState, "Line 1")).toBe("first-snippet-id");
        expect(snippetContainingText(updatedState, "Line 2")).toBe(action.snippetId);
        expect(snippetContainingText(updatedState, "Line 3")).toBe("first-snippet-id");
        const newSnippetId = action.snippetId;
        for (const movedChunkVersionId of updatedState.snippets.byId[newSnippetId]
          .chunkVersionsAdded) {
          expect(updatedState.visibilityRules).toMatchObject({
            ["first-snippet-id"]: {
              [movedChunkVersionId]: {
                0: visibility.VISIBLE
              }
            }
          });
        }
      });

      it("from the reference implementation", () => {
        const text = createUndoable({
          chunks: {
            all: ["chunk-0"],
            byId: {
              "chunk-0": { location: { line: 1, path: "same-path" }, versions: ["chunk-version-0"] }
            }
          },
          chunkVersions: {
            all: ["chunk-version-0"],
            byId: {
              "chunk-version-0": {
                chunk: "chunk-0",
                text: "Line 1\nLine 2\nLine 3"
              }
            }
          }
        });
        const action = actions.createSnippet(0, {
          location: { path: "same-path", line: 2 },
          text: "Line 2"
        });
        const updatedState = textReducer(text, action);
        expect(snippetContainingText(updatedState, "Line 2")).toBe(action.snippetId);
        expect(containsChunk(updatedState, 1, "Line 1")).toBe(true);
        expect(containsChunk(updatedState, 2, "Line 2")).toBe(true);
        expect(containsChunk(updatedState, 3, "Line 3")).toBe(true);
        /*
         * Visibility rules shouldn't change: the new snippet has been taken from code that
         * hasn't yet appeared in a snippet.
         */
        expect(updatedState.visibilityRules).toEqual({});
      });
    });

    function containsChunk(state: Undoable, line: number, firstVersionText: string) {
      for (const chunkId of state.chunks.all) {
        const chunk = state.chunks.byId[chunkId];
        const firstChunkVersion = state.chunkVersions.byId[chunk.versions[0]];
        if (chunk.location.line === line && firstChunkVersion.text === firstVersionText) {
          return true;
        }
      }
      return false;
    }

    function snippetContainingText(state: Undoable, text: string): SnippetId | null {
      for (let snippetIndex = 0; snippetIndex < state.snippets.all.length; snippetIndex++) {
        const snippet = state.snippets.byId[state.snippets.all[snippetIndex]];
        for (const chunkVersionId of snippet.chunkVersionsAdded) {
          if (state.chunkVersions.byId[chunkVersionId].text === text) {
            return state.snippets.all[snippetIndex];
          }
        }
      }
      return null;
    }

    it("removes chunks when all its lines are added to an earlier snippet", () => {
      const text = createUndoableWithSnippet(
        "cell-id",
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
      const newSnippet = updatedState.snippets.byId[action.snippetId];
      const newChunkVersion = updatedState.chunkVersions.byId[newSnippet.chunkVersionsAdded[0]];
      const newChunkId = newChunkVersion.chunk;
      expect(updatedState.chunks.all).toEqual([newChunkId]);
    });

    it("updates visibility rules with updated chunk version IDs", () => {
      const text = createUndoable({
        cells: {
          byId: {
            "cell-0": {
              contentId: "snippet-0",
              type: ContentType.SNIPPET
            },
            "cell-1": {
              contentId: "snippet-1",
              type: ContentType.SNIPPET
            }
          },
          all: ["cell-0", "cell-1"]
        },
        snippets: {
          byId: {
            "snippet-0": { chunkVersionsAdded: ["chunk-version-0"] },
            "snippet-1": { chunkVersionsAdded: [] }
          },
          all: ["snippet-0", "snippet-1"]
        },
        chunks: {
          byId: {
            "chunk-0": { location: { line: 1, path: "same-path" }, versions: ["chunk-version-0"] }
          },
          all: ["chunk-0"]
        },
        chunkVersions: {
          byId: {
            "chunk-version-0": { text: "Same line", chunk: "chunk-0" }
          },
          all: ["chunk-version-0"]
        },
        visibilityRules: {
          "snippet-1": {
            "chunk-version-0": {
              0: visibility.VISIBLE
            }
          }
        }
      });
      const action = actions.createSnippet(0, {
        location: { path: "same-path", line: 1 },
        text: "Same line"
      });
      const updatedState = textReducer(text, action);
      expect(updatedState.chunkVersions.all.length).toBe(1);
      const newChunkVersionId = updatedState.chunkVersions.all[0];
      expect(updatedState.visibilityRules).toMatchObject({
        "snippet-1": {
          [newChunkVersionId]: {
            0: visibility.VISIBLE
          }
        }
      });
    });

    /*
     * TODO(andrewhead): Add to errors. textReducer should take in two slices of state: text, and
     * errors. It returns new versions of both slices.
     */
    // it("throws an error when splitting a snippet with 2+ versions", () => {});
  });

  describe("should handle SET_SELECTIONS", () => {
    const text = createUndoable();
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
