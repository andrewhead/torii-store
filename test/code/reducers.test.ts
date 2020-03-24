import { ContentType } from "../../src";
import * as cellActions from "../../src/cells/actions";
import * as actions from "../../src/code/actions";
import { codeReducer } from "../../src/code/reducers";
import {
  codeActionNames,
  MergeAction,
  MergeStrategy,
  ReferenceImplementationSource,
  SnippetId,
  SourceType,
  visibility
} from "../../src/code/types";
import { Undoable } from "../../src/state/types";
import { createChunks, createUndoable } from "../../src/util/test-utils";
import * as textUtils from "../../src/util/text-utils";

describe("code reducer", () => {
  describe("should handle UPLOAD_FILE_CONTENTS", () => {
    it("should create a chunk with the file contents", () => {
      const path = "file-path";
      const code = createUndoable();
      const action = actions.uploadFileContents(path, "File contents");
      expect(codeReducer(code, action)).toMatchObject({
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
      expect(code.snippets.all.length).toBe(0);
    });
  });

  describe("should handle INSERT_SNIPPET", () => {
    it("should create an empty snippet", () => {
      const code = createChunks();
      const action = actions.insertSnippet(0);
      expect(codeReducer(code, action)).toMatchObject({
        snippets: {
          all: [action.snippetId],
          byId: {
            [action.snippetId]: { chunkVersionsAdded: [] }
          }
        }
      });
    });

    describe("should create new chunks", () => {
      const code = createChunks();
      const location = { path: "path", line: 1 };
      const action = actions.insertSnippet(0, { location, text: "Text" });
      const updatedState = codeReducer(code, action); //update code state to insert snippet
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
            [chunkVersionId]: { // versioning per chunkversion, new chunkversion by opening up snapshot view
              text: "Text",
              chunk: chunkId // pointing back to chunkID
            }
          },
          all: [chunkVersionId] 
        }
      });
    });

    it("should hide ranges shown in earlier snippets", () => {
      const code = createChunks({
        snippetId: "snippet-id",
        chunkId: "overlapping-chunk-id",
        chunkVersionId: "other-chunk-version-id",
        path: "same-path",
        line: 2,
        text: "Line 1\nLine 2"
      });
      /*
       * Snippet intersects with last snippet: only include the new parts (Line 0). Show the old
       * parts (Line 1, or line with index 0, from the earlier chunk).
       */
      const action = actions.insertSnippet(1, {
        location: { path: "same-path", line: 1 },
        text: "Line 0\nLine 1"
      });
      const updatedState = codeReducer(code, action);
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
              0: visibility.VISIBLE
            }
          }
        }
      });
    });

    it("does not add new chunks if all text was included before", () => {
      const code = createChunks({
        snippetId: "snippet-id",
        chunkId: "overlapping-chunk-id",
        chunkVersionId: "other-chunk-version-id",
        path: "same-path",
        line: 1,
        text: "Line 1\nLine 2"
      });
      /*
       * Snippet intersects completely with last snippet: Don't add a new snippet.
       */
      const action = actions.insertSnippet(1, {
        location: { path: "same-path", line: 1 },
        text: "Line 1\nLine 2"
      });
      const updatedState = codeReducer(code, action);
      expect(updatedState.chunks.all.length).toBe(1);
      expect(updatedState.chunkVersions.all.length).toBe(1);
    });

    describe("splits other chunks", () => {
      it("from other snippets", () => {
        const code = createChunks({
          snippetId: "first-snippet-id",
          chunkId: "overlapping-chunk-id",
          chunkVersionId: "other-chunk-version-id",
          path: "same-path",
          line: 1,
          text: "Line 1\nLine2\nLine 3"
        });
        /**
         * Snippet interesects the middle of the snippet that comes after it. Split the snippet that
         * comes after, while making sure that the lines still appear in it.
         */
        const action = actions.insertSnippet(0, {
          location: { path: "same-path", line: 2 },
          text: "Line 2"
        });
        const updatedState = codeReducer(code, action);
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
        const code = createChunks({
          snippetId: null,
          chunkId: "chunk-0",
          chunkVersionId: "chunk-version-0",
          path: "same-path",
          line: 1,
          text: "Line 1\nLine 2\nLine 3"
        });
        const action = actions.insertSnippet(0, {
          location: { path: "same-path", line: 2 },
          text: "Line 2"
        });
        const updatedState = codeReducer(code, action);
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
      const code = createChunks({
        snippetId: "snippet-id",
        chunkId: "overlapping-chunk-id",
        chunkVersionId: "other-chunk-version-id",
        path: "same-path",
        line: 1,
        text: "Line 1"
      });
      const action = actions.insertSnippet(0, {
        location: { path: "same-path", line: 1 },
        text: "Line 1"
      });
      const updatedState = codeReducer(code, action);
      const newSnippet = updatedState.snippets.byId[action.snippetId];
      const newChunkVersion = updatedState.chunkVersions.byId[newSnippet.chunkVersionsAdded[0]];
      const newChunkId = newChunkVersion.chunk;
      expect(updatedState.chunks.all).toEqual([newChunkId]);
    });

    it("updates visibility rules with updated chunk version IDs", () => {
      const code = createUndoable({
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
      const action = actions.insertSnippet(0, {
        location: { path: "same-path", line: 1 },
        text: "Same line"
      });
      const updatedState = codeReducer(code, action);
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

  describe("should handle FORK", () => {
    it("should create a new chunk version", () => {
      const snippetId = "snippet-id";
      const chunkId = "chunk-id";
      const chunkVersionId = "chunk-version-id";
      const text = "Initial chunk version text";
      const action = actions.fork(chunkVersionId);
      const code = createChunks({
        snippetId,
        chunkId,
        chunkVersionId,
        text
      });
      const updatedCode = codeReducer(code, action);
      expect(updatedCode).toMatchObject({
        chunkVersions: {
          byId: {
            [chunkVersionId]: {
              text
            }
          }
        },
        chunks: {
          byId: {
            [chunkId]: {
              /**
               * Order the versions were created in must be preserved. It must be possible to
               * infer that the first chunk version is the reference implementation.
               */
              versions: [chunkVersionId, action.forkId]
            }
          }
        }
      });
      expect(updatedCode.chunkVersions.all).toContain(chunkVersionId);
      expect(updatedCode.chunkVersions.all).toContain(action.forkId);
    });

    it("should move selections", () => {
      const chunkVersionId = "chunk-version-id";
      const state = createChunks({ chunkVersionId });
      const selectionBefore = {
        anchor: { line: 1, character: 0 },
        active: { line: 1, character: 2 },
        path: "file-path",
        relativeTo: { source: SourceType.CHUNK_VERSION, chunkVersionId }
      };
      state.selections = [selectionBefore];
      const action = actions.fork(chunkVersionId);
      const expectedSelection = {
        ...selectionBefore,
        relativeTo: { source: SourceType.CHUNK_VERSION, chunkVersionId: action.forkId }
      };
      expect(codeReducer(state, action)).toMatchObject({
        selections: [expectedSelection]
      });
    });
  });

  describe("should handle PICK_CHUNK_VERSION", () => {
    it("should change the chunk version for a snippet", () => {
      const snippetId = "snippet-id";
      const chunkId = "chunk-id";
      const beforeChunkVersionId = "before-chunk-version-id";
      const afterChunkVersionId = "after-chunk-version-id";
      const action = actions.pickChunkVersion(snippetId, chunkId, afterChunkVersionId);
      const code = createChunks({
        snippetId,
        chunkId,
        chunkVersionId: beforeChunkVersionId
      });
      expect(codeReducer(code, action)).toMatchObject({
        snippets: {
          byId: {
            [snippetId]: {
              chunkVersionsAdded: [afterChunkVersionId]
            }
          }
        }
      });
    });
  });

  describe("should handle MERGE", () => {
    const snippetId = "snippetId";
    const into = "into-chunk-version-id";
    const chunkVersionId = "chunk-version-id";
    const version0Text = "Version 0 Text";
    const version1Text = "Version 1 Text";

    function mergeTestState() {
      return createChunks(
        {
          snippetId: "snippet-0",
          chunkId: "same-chunk",
          chunkVersionId: into,
          text: version0Text
        },
        {
          snippetId,
          chunkId: "same-chunk",
          chunkVersionId,
          text: version1Text
        }
      );
    }

    function mergeAction(strategy: MergeStrategy, replace: boolean): MergeAction {
      return {
        type: codeActionNames.MERGE,
        chunkVersionId,
        snippetId,
        into,
        strategy,
        replaceMergedVersion: replace
      };
    }

    it("should merge in text", () => {
      const action = mergeAction(MergeStrategy.SAVE_CHANGES, false);
      const state = codeReducer(mergeTestState(), action);
      expect(state.chunkVersions.byId[into].text).toEqual(version1Text);
    });

    it("should discard text", () => {
      const action = mergeAction(MergeStrategy.REVERT_CHANGES, false);
      const state = codeReducer(mergeTestState(), action);
      expect(state.chunkVersions.byId[into].text).toEqual(version0Text);
    });

    it("should replace the chunk version", () => {
      const action = mergeAction(MergeStrategy.REVERT_CHANGES, true);
      const state = codeReducer(mergeTestState(), action);
      expect(state.snippets.byId[snippetId].chunkVersionsAdded).toContain(into);
    });

    it("should not replace the chunk version", () => {
      const action = mergeAction(MergeStrategy.REVERT_CHANGES, false);
      const state = codeReducer(mergeTestState(), action);
      expect(state.snippets.byId[snippetId].chunkVersionsAdded).not.toContain(into);
    });

    it("should move selections from 'merge' to 'into'", () => {
      const code = mergeTestState();
      const selectionBefore = {
        anchor: { line: 1, character: 0 },
        active: { line: 1, character: 2 },
        path: "file-path",
        relativeTo: { source: SourceType.CHUNK_VERSION, chunkVersionId }
      };
      code.selections = [selectionBefore];
      const expectedSelection = {
        ...selectionBefore,
        relativeTo: { source: SourceType.CHUNK_VERSION, chunkVersionId: into }
      };
      expect(codeReducer(code, mergeAction(MergeStrategy.REVERT_CHANGES, true))).toMatchObject({
        selections: [expectedSelection]
      });
    });
  });

  describe("should handle SET_SELECTIONS", () => {
    const code = createChunks();
    const selection = {
      anchor: { line: 1, character: 0 },
      active: { line: 1, character: 2 },
      path: "file-path",
      relativeTo: { source: SourceType.REFERENCE_IMPLEMENTATION } as ReferenceImplementationSource
    };
    expect(codeReducer(code, actions.setSelections(selection))).toMatchObject({
      selections: [selection]
    });
  });

  describe("should handle EDIT", () => {
    it("should edit a chunk's text", () => {
      const code = createChunks({
        chunkVersionId: "chunk-version-0",
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
      expect(codeReducer(code, actions.edit(range, newText))).toMatchObject({
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
      const code = createChunks({
        chunkVersionId: "chunk-version-0",
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
      expect(codeReducer(code, actions.edit(range, newText))).toMatchObject({
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
      const code = createChunks(
        {
          chunkVersionId: "chunk-version-0",
          chunkId: "chunk-0",
          line: 3,
          text: "Line 1A"
        },
        {
          chunkVersionId: "chunk-version-1",
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
      expect(codeReducer(code, actions.edit(range, newText))).toMatchObject({
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
      const code = createChunks({
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
      expect(codeReducer(code, actions.edit(range, newText))).toMatchObject({
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
      const code = createChunks(
        {
          chunkVersionId: "chunk-version-0",
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
      expect(codeReducer(code, actions.edit(range, newText))).toMatchObject({
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

  describe("should handle DELETE", () => {
    it("should delete a snippet", () => {
      const state = createChunks(
        { cellId: "cell-0", snippetId: "snippet-0" },
        { cellId: "cell-1", snippetId: "snippet-1" }
      );
      const updatedState = codeReducer(
        state,
        cellActions.deleteCell("cell-0", ContentType.SNIPPET, "snippet-0")
      );
      expect(updatedState.snippets.all).toEqual(["snippet-1"]);
      expect(Object.keys(updatedState.snippets.byId)).toEqual(["snippet-1"]);
    });
  });
});

describe("should handle SPLICE_SNIPPET", () => {
  it("splices new chunks into an empty snippet", () => {

    const code = createChunks();
    const location = { path: "file-path", line: 1 };
    const action = actions.spliceSnippet("snippet-id", [{ location, text: "Text" }]);
    const updatedState = codeReducer(code, action); 

    // checks
    expect(updatedState.chunks.all.length).toEqual(1);
    expect(updatedState.chunkVersions.all.length).toEqual(1);

    expect(Object.keys(updatedState.snippets.byId)).toEqual(["snippet-id"])

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

  it("should handle splicing multiple chunks into an existing snippet", () => {
    const code = createChunks(
      { cellId: "cell-0", snippetId: "snippet-id" }
    );
    const firstLocation = { path: "file-path", line: 1 };
    const firstAction = actions.spliceSnippet("snippet-id", [{ location: firstLocation, text: "Text1" }]);
    const firstUpdate = codeReducer(code, firstAction); 

    const secondLocation = { path: "file-path", line: 2 };
    const secondAction = actions.spliceSnippet("snippet-id", [{ location: secondLocation, text: "Text2" }]);
    const updatedState = codeReducer(firstUpdate, secondAction);
    
    expect(updatedState.chunks.all.length).toEqual(3);
    expect(updatedState.chunkVersions.all.length).toEqual(3);

    // chunks and chunkversion might be tangled
    const chunkId1 = updatedState.chunks.all[1];
    const chunkId2 = updatedState.chunks.all[2];

    const chunkVersionId1 = updatedState.chunks.byId[chunkId1].versions[0];
    const chunkVersionId2 = updatedState.chunks.byId[chunkId2].versions[0];

    const allChunkIds = updatedState.chunks.all;
    const allChunkVersionIds = updatedState.chunkVersions.all;

    expect(updatedState).toMatchObject({ // does a partial match
      snippets: {
        byId: {
          [secondAction.snippetId]: {
            chunkVersionsAdded: allChunkVersionIds
          }
        }
      },
      chunks: {
        byId: {
          [chunkId1]: {
            location: firstLocation,
            versions: [chunkVersionId1]
          },
          [chunkId2]: {
            location:secondLocation,
            versions: [chunkVersionId2]
          }
        },
        all: allChunkIds
      },
      chunkVersions: {
        byId: {
          [chunkVersionId1]: {
            text: "Text1",
            chunk: chunkId1
          },
          [chunkVersionId2]: {
            text: "Text2",
            chunk: chunkId2
          }
        },
        all: allChunkVersionIds
      }
    });

    const secondUpdatedState = codeReducer(code, firstAction); 
  })
});