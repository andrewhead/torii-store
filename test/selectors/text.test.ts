import { getReferenceImplementationText } from "../../src/selectors/text";
import { createChunks } from "../../src/util/test-utils";

describe("getReferenceImplementationText", () => {
  it("gets text from chunks", () => {
    const path = "file-path";
    const text = createChunks(
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
    expect(getReferenceImplementationText(text, path)).toEqual("Line 1\nLine 2\nLine 3\nLine 4");
  });
});

describe("getFileContents", () => {
  it("gets contents of all files", () => {});

  it("adds text in cell order", () => {});

  it("picks the most recent version", () => {});
});
