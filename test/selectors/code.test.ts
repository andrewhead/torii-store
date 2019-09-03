import { textUtils } from "../../src";
import {
  getFileContents,
  getReferenceImplementationText,
  getSnapshotOrderedChunkVersions
} from "../../src/selectors/code";
import { createChunks, createStateWithChunks } from "../../src/util/test-utils";

describe("getReferenceImplementationText", () => {
  it("gets text from chunks", () => {
    const path = "file-path";
    const code = createChunks(
      {
        snippetId: "snippet-0",
        chunkId: "chunk-1",
        chunkVersionId: "chunk-version-1",
        path,
        line: 3,
        text: "Line 3\nLine 4"
      },
      {
        /*
         * Chunk hasn't yet been added to a snippet.
         */
        snippetId: null,
        chunkId: "chunk-0",
        chunkVersionId: "chunk-version-0",
        path,
        line: 1,
        text: "Line 1\nLine 2"
      }
    );
    expect(getReferenceImplementationText(code, path)).toEqual("Line 1\nLine 2\nLine 3\nLine 4");
  });
});

describe("getSnapshotOrderedChunkVersions", () => {
  it("gets ordered chunk versions", () => {
    const path = "file-path";
    const overwrittenChunkVersion = {
      snippetId: "snippet-0",
      chunkId: "chunk-0",
      chunkVersionId: "chunk-0-version-0",
      line: 1,
      path
    };
    const overwritingChunkVersion = {
      snippetId: "snippet-1",
      chunkId: "chunk-0",
      chunkVersionId: "chunk-0-version-1",
      line: 1,
      path
    };
    const notOverwrittenChunkVersion = {
      snippetId: "snippet-0",
      chunkId: "chunk-1",
      chunkVersionId: "chunk-1-version-0",
      line: 2,
      path
    };
    const state = createStateWithChunks(
      overwrittenChunkVersion,
      overwritingChunkVersion,
      notOverwrittenChunkVersion
    );
    const chunkVersionIds = getSnapshotOrderedChunkVersions(state, "snippet-1", path);
    expect(chunkVersionIds).not.toContain("chunk-0-version-0");
    expect(chunkVersionIds).toContain("chunk-0-version-1");
    expect(chunkVersionIds).toContain("chunk-1-version-0");
  });
});

describe("getFileContents", () => {
  it("gets contents", () => {
    const state = createStateWithChunks({
      snippetId: "snippet-0",
      path: "file-path",
      line: 1,
      text: "Line 1"
    });
    expect(getFileContents(state, "snippet-0")).toEqual({
      "file-path": "Line 1"
    });
  });

  it("gets contents of all files", () => {
    const state = createStateWithChunks(
      {
        snippetId: "snippet-0",
        path: "file-1",
        line: 1,
        text: "File 1, Line 1"
      },
      {
        snippetId: "snippet-0",
        path: "file-2",
        line: 1,
        text: "File 2, Line 1"
      }
    );
    expect(getFileContents(state, "snippet-0")).toEqual({
      "file-1": "File 1, Line 1",
      "file-2": "File 2, Line 1"
    });
  });

  it("adds text from multiple snippets", () => {
    const state = createStateWithChunks(
      {
        snippetId: "snippet-0",
        path: "file-path",
        line: 2,
        text: "Line 2"
      },
      {
        snippetId: "snippet-1",
        path: "file-path",
        line: 1,
        text: "Line 1"
      }
    );
    expect(getFileContents(state, "snippet-1")).toEqual({
      "file-path": textUtils.join("Line 1", "Line 2")
    });
  });

  it("picks the most recent version", () => {
    const state = createStateWithChunks(
      {
        snippetId: "snippet-0",
        chunkId: "chunk-0",
        chunkVersionId: "chunk-version-0",
        line: 1,
        path: "file-path",
        text: "Version 0 text"
      },
      {
        snippetId: "snippet-1",
        chunkId: "chunk-0",
        chunkVersionId: "chunk-version-1",
        line: 1,
        path: "file-path",
        text: "Version 1 text"
      }
    );
    expect(getFileContents(state, "snippet-1")).toEqual({
      "file-path": "Version 1 text"
    });
  });

  it("stops at 'until'", () => {
    const state = createStateWithChunks(
      {
        snippetId: "snippet-0",
        line: 1,
        path: "file-path",
        text: "Line 1"
      },
      {
        snippetId: "snippet-1",
        line: 2,
        path: "file-path",
        text: "Line 2 (DON'T INCLUDE)"
      }
    );
    expect(getFileContents(state, "snippet-0")).toEqual({
      "file-path": "Line 1"
    });
  });
});
