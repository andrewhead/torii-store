import { ContentType } from "../../src/cells/types";
import * as actions from "../../src/code/actions";
import {
  codeActionNames as names,
  MergeStrategy,
  ReferenceImplementationSource,
  Selection,
  SourceType,
  InitialChunk
} from "../../src/code/types";
import { createStateWithChunks, createStateWithUndoable } from "../../src/util/test-utils";
import { isTextAction } from "../../src/texts/types";

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

  describe("should create an action for creating snippets", () => {
    it("at an index", () => {
      const index = 0;
      const expectedAction = {
        index,
        chunks: [],
        type: names.INSERT_SNIPPET
      };
      expect(actions.insertSnippet(index)).toMatchObject(expectedAction);
    });

    it("after the selected cell", () => {
      const state = createStateWithUndoable({
        selectedCell: "cell-0",
        cells: {
          all: ["cell-0"],
          byId: { "cell-0": { contentId: "snippet-id", type: ContentType.SNIPPET } }
        }
      });
      const action = actions.insertSnippet(state);
      expect(action).toMatchObject({ index: 1 });
    });
  });

  describe("should create an action for splicing snippets", () => {
    it("into an exisiting snippet", () => {
      const snippetId = "snippet-id"; // following similar test formats below!
      const initialChunks: InitialChunk[] = [{
        location: { line: 0, path: "file-path" },
        text: "new chunk"
      }];
      const expectedAction = {
        snippetId,
        chunks: initialChunks,
        type: names.SPLICE_SNIPPET
      };
      expect(actions.spliceSnippet(
         snippetId, initialChunks
      )).toMatchObject(expectedAction);
    });
  });

  it("should create an action for forking a chunk version", () => {
    const chunkVersionId = "chunk-version-id";
    const action = actions.fork(chunkVersionId);
    expect(action).toMatchObject({
      chunkVersionId,
      type: names.FORK
    });
    expect(action.forkId).toBeDefined();
  });

  it("should create an action for picking a chunk version", () => {
    const snippetId = "snippet-id";
    const chunkId = "chunk-id";
    const chunkVersionId = "chunk-version-id";
    expect(actions.pickChunkVersion(snippetId, chunkId, chunkVersionId)).toEqual({
      snippetId,
      chunkId,
      chunkVersionId,
      type: names.PICK_CHUNK_VERSION
    });
  });

  describe("should create an action for merging a chunk version", () => {
    it("finds a merge target in the reference implementation", () => {
      const snippetId = "snippet-id";
      const into = "into-chunk-version-id";
      const chunkVersionId = "to-merge-chunk-version-id";
      const state = createStateWithChunks(
        /*
         * First chunk version isn't in a snippet or cell---it's the reference implementation.
         * It should be pulled into the snippet during a merge.
         */
        {
          snippetId: null,
          chunkId: "same-chunk-id",
          chunkVersionId: into
        },
        {
          snippetId,
          chunkId: "same-chunk-id",
          chunkVersionId
        }
      );
      const strategy = MergeStrategy.REVERT_CHANGES;
      expect(actions.merge(state, snippetId, chunkVersionId, strategy)).toEqual({
        snippetId,
        chunkVersionId,
        into,
        strategy,
        replaceMergedVersion: true,
        type: names.MERGE
      });
    });

    it("finds a merge target in past snippets", () => {
      const snippetId = "snippet-id";
      const into = "into-chunk-version-id";
      const chunkVersionId = "to-merge-chunk-version-id";
      const state = createStateWithChunks(
        {
          snippetId: "snippet-before",
          chunkId: "chunk-0",
          chunkVersionId: into
        },
        {
          snippetId,
          chunkId: "chunk-0",
          chunkVersionId
        }
      );
      const strategy = MergeStrategy.REVERT_CHANGES;
      expect(actions.merge(state, snippetId, chunkVersionId, strategy)).toEqual({
        snippetId,
        chunkVersionId,
        into,
        strategy,
        replaceMergedVersion: false,
        type: names.MERGE
      });
    });
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
