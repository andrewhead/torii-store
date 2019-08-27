import {
  deferrable,
  getChangedSnapshots,
  getReferenceImplementationText
} from "../../src/util/state-utils";
import { createSnippets, createState, createUndoable } from "../../src/util/test-utils";

describe("getReferenceImplementationText", () => {
  it("gets text from chunks", () => {
    const path = "file-path";
    const text = createUndoable({
      snippets: {
        all: ["snippet-0"],
        byId: {
          "snippet-0": {
            chunkVersionsAdded: ["chunk-version-1"]
          }
        }
      },
      chunks: {
        all: ["chunk-0", "chunk-1"],
        byId: {
          "chunk-0": {
            location: { line: 3, path },
            versions: ["chunk-version-0"]
          },
          "chunk-1": {
            location: { line: 1, path },
            versions: ["chunk-version-1"]
          }
        }
      },
      chunkVersions: {
        all: ["chunk-version-0"],
        byId: {
          "chunk-version-0": {
            text: "Line 3\nLine 4",
            chunk: "chunk-0"
          },
          "chunk-version-1": {
            text: "Line 1\nLine 2",
            chunk: "chunk-1"
          }
        }
      }
    });
    expect(getReferenceImplementationText(text, path)).toEqual("Line 1\nLine 2\nLine 3\nLine 4");
  });
});

describe("getChangedSnapshots", () => {
  it("gets a new snippet", () => {
    const before = createState();
    const after = createState({
      undoable: {
        present: createSnippets({ snippetId: "snippet-id", line: 1, text: "Line 1" })
      }
    });
    expect(getChangedSnapshots(before, after)).toEqual(["snippet-id"]);
  });

  it("doesn't get an unchanged snippet", () => {
    const state = createState({
      undoable: {
        present: createSnippets({ snippetId: "snippet-id", line: 1, text: "Line 1" })
      }
    });
    expect(getChangedSnapshots(state, state)).toEqual([]);
  });

  it("gets a snippet with an added chunk", () => {
    const before = createState({
      undoable: {
        present: createSnippets({
          snippetId: "snippet-id",
          chunkId: "chunk-0",
          chunkVersionId: "chunk-version-0",
          line: 1,
          text: "Line 1"
        })
      }
    });
    const after = createState({
      undoable: {
        present: createSnippets(
          {
            snippetId: "snippet-id",
            chunkId: "chunk-0",
            chunkVersionId: "chunk-version-0",
            line: 1,
            text: "Line 1"
          },
          {
            snippetId: "snippet-id",
            chunkId: "chunk-1",
            chunkVersionId: "chunk-version-1",
            line: 2,
            text: "Line 2"
          }
        )
      }
    });
    expect(getChangedSnapshots(before, after)).toEqual(["snippet-id"]);
  });

  it("gets a snippet with a changed chunk", () => {
    const before = createState({
      undoable: {
        present: createSnippets({
          snippetId: "snippet-id",
          chunkId: "chunk-0",
          chunkVersionId: "chunk-version-0",
          line: 1,
          text: "Line 1"
        })
      }
    });
    const after = createState({
      undoable: {
        present: createSnippets({
          snippetId: "snippet-id",
          chunkId: "chunk-0",
          chunkVersionId: "chunk-version-0",
          line: 1,
          /*
           * Text of one of the snippet's chunks has changed.
           */
          text: "Line Changed"
        })
      }
    });
    expect(getChangedSnapshots(before, after)).toEqual(["snippet-id"]);
  });

  it("gets a snippet that comes after a changed snippet", () => {
    const before = createState({
      undoable: {
        present: createSnippets(
          {
            snippetId: "snippet-0",
            chunkId: "chunk-0",
            chunkVersionId: "chunk-version-0",
            line: 1,
            text: "Line 1"
          },
          {
            snippetId: "snippet-1",
            chunkId: "chunk-1",
            chunkVersionId: "chunk-version-1",
            line: 2,
            text: "Line 2"
          }
        )
      }
    });
    /*
     * Text of one of the first snippet's chunks has changed, but the text of the second snippet
     * hasn't changed. However, the snapshot of the second snippet should have changed.
     */
    const after = createState({
      undoable: {
        present: createSnippets(
          {
            snippetId: "snippet-0",
            chunkId: "chunk-0",
            chunkVersionId: "chunk-version-0",
            line: 1,
            text: "Line Changed"
          },
          {
            snippetId: "snippet-1",
            chunkId: "chunk-1",
            chunkVersionId: "chunk-version-1",
            line: 2,
            text: "Line 2"
          }
        )
      }
    });
    expect(getChangedSnapshots(before, after)).toEqual(["snippet-0", "snippet-1"]);
  });
});

describe("deferrable", () => {
  it("executes when not deferred", done => {
    const callback = () => {
      done();
    };
    const wrapped = deferrable(callback);
    wrapped();
  });

  it("defers execution", done => {
    const SHORT_DELAY = 1;
    const callback = (msg: string) => {
      expect(msg).toEqual("last while deferred");
      done();
    };
    const wrapped = deferrable(callback);
    wrapped.defer(SHORT_DELAY);
    wrapped("skip");
    wrapped("skip");
    wrapped("last while deferred");
  });
});
