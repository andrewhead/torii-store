import { ContentType } from "../../src/cells/types";
import { getChangedSnapshots, getMarkdown } from "../../src/selectors/state";
import { createState } from "../../src/util/state-utils";
import {
  addCell,
  addChunk,
  addChunkVersion,
  addConsoleOutput,
  addSnippet,
  addText,
  createStateWithChunks,
  createStateWithUndoable,
  createUndoable
} from "../../src/util/test-utils";

describe("getChangedSnapshots", () => {
  it("gets a new snippet", () => {
    const before = createState();
    const after = createStateWithChunks({ snippetId: "snippet-id", line: 1, text: "Line 1" });
    expect(getChangedSnapshots(before, after)).toEqual(["snippet-id"]);
  });

  it("gets a new snippet when before is undefined", () => {
    const after = createStateWithChunks({ snippetId: "snippet-id", line: 1, text: "Line 1" });
    expect(getChangedSnapshots(undefined, after)).toEqual(["snippet-id"]);
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

describe("getMarkdown", () => {
  it("dumps text", () => {
    const undoable = createUndoable();
    addCell(undoable, "text-cell-id", ContentType.TEXT, "text-id", false);
    addText(undoable, "text-id", "Text *bold* more text.");
    const state = createStateWithUndoable(undoable);
    expect(getMarkdown(state)).toMatch("Text *bold* more text.");
  });

  it("hides cells", () => {
    const undoable = createUndoable();
    addCell(undoable, "text-cell-id", ContentType.TEXT, "text-id", true);
    addText(undoable, "text-id", "Text *bold* more text.");
    const state = createStateWithUndoable(undoable);
    expect(getMarkdown(state)).toMatch(
      /\<div class="hidden-cell"\>\s*Text \*bold\* more text.\s*<\/div>/
    );
  });

  it("includes snippet code with detected language", () => {
    const undoable = createUndoable();
    addCell(undoable, "snippet-cell-id", ContentType.SNIPPET, "snippet-id", false);
    addSnippet(undoable, "snippet-id", "chunk-version-id");
    addChunk(undoable, "chunk-id", { line: 1, path: "file.py" }, "chunk-version-id");
    addChunkVersion(undoable, "chunk-version-id", "chunk-id", "print('Hello world')");
    const state = createStateWithUndoable(undoable);
    expect(getMarkdown(state)).toMatch(/```[Pp]ython\s*\nprint\('Hello world'\)\s*```/);
  });

  it("hides snapshot code", () => {
    const undoable = createUndoable();
    addCell(undoable, "snippet-cell-0", ContentType.SNIPPET, "snippet-0", false);
    addCell(undoable, "snippet-cell-1", ContentType.SNIPPET, "snippet-1", false);
    addSnippet(undoable, "snippet-0", "chunk-0-version-id");
    addSnippet(undoable, "snippet-1", "chunk-1-version-id");
    addChunk(undoable, "chunk-0", { line: 1, path: "file.py" }, "chunk-0-version-id");
    addChunk(undoable, "chunk-1", { line: 2, path: "file.py" }, "chunk-1-version-id");
    addChunkVersion(undoable, "chunk-0-version-id", "chunk-0", "x = 1");
    addChunkVersion(undoable, "chunk-1-version-id", "chunk-1", "y = 2");
    const state = createStateWithUndoable(undoable);
    expect(getMarkdown(state)).toMatch(
      /<div class='snapshot hidden'>\n```.*\nx = 1\ny = 2\n```\n<\/div>/
    );
  });

  it("has console outputs", () => {
    const undoable = createUndoable();
    addCell(
      undoable,
      "output-cell-id",
      ContentType.OUTPUT,
      { snippetId: "snippet-id", commandId: "command-id" },
      false
    );
    const state = createStateWithUndoable(undoable);
    addConsoleOutput(state, "snippet-id", "command-id", "Hello world");
    expect(getMarkdown(state)).toMatch(
      /<div class="output console finished">\nHello world\n<\/div>/
    );
  });
});
