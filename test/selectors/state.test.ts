import { getChangedSnapshots } from "../../src/selectors/state";
import { createState, createStateWithChunks } from "../../src/util/test-utils";

describe("getChangedSnapshots", () => {
  it("gets a new snippet", () => {
    const before = createState();
    const after = createStateWithChunks({ snippetId: "snippet-id", line: 1, text: "Line 1" });
    expect(getChangedSnapshots(before, after)).toEqual(["snippet-id"]);
  });

  it("doesn't get an unchanged snippet", () => {
    const state = createStateWithChunks({ snippetId: "snippet-id", line: 1, text: "Line 1" });
    expect(getChangedSnapshots(state, state)).toEqual([]);
  });

  it("gets a snippet with an added chunk", () => {
    const before = createStateWithChunks({
      snippetId: "snippet-id",
      chunkId: "chunk-0",
      chunkVersionId: "chunk-version-0",
      line: 1,
      text: "Line 1"
    });
    const after = createStateWithChunks(
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
    );
    expect(getChangedSnapshots(before, after)).toEqual(["snippet-id"]);
  });

  it("gets a snippet with a changed chunk", () => {
    const before = createStateWithChunks({
      snippetId: "snippet-id",
      chunkId: "chunk-0",
      chunkVersionId: "chunk-version-0",
      line: 1,
      text: "Line 1"
    });
    const after = createStateWithChunks({
      snippetId: "snippet-id",
      chunkId: "chunk-0",
      chunkVersionId: "chunk-version-0",
      line: 1,
      /*
       * Text of one of the snippet's chunks has changed.
       */
      text: "Line Changed"
    });
    expect(getChangedSnapshots(before, after)).toEqual(["snippet-id"]);
  });

  it("gets a snippet that comes after a changed snippet", () => {
    const before = createStateWithChunks(
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
    );
    /*
     * Text of one of the first snippet's chunks has changed, but the text of the second snippet
     * hasn't changed. However, the snapshot of the second snippet should have changed.
     */
    const after = createStateWithChunks(
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
    );
    expect(getChangedSnapshots(before, after)).toEqual(["snippet-0", "snippet-1"]);
  });
});
