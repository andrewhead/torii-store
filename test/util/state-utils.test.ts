import { deferrable, getReferenceImplementationText } from "../../src/util/state-utils";
import { createText } from "../store/text/util";

describe("getReferenceImplementationText", () => {
  it("gets text from chunks", () => {
    const path = "file-path";
    const text = createText({
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
