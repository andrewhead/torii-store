import { getSnippetPaths } from "../../../src/selectors/code/snippet";
import * as testUtils from "../../../src/util/test-utils";

describe("getSnippetPaths", () => {
  it("gets the paths of chunks in the snippet", () => {
    const snippetId = "snippet-0";
    const state = testUtils.createStateWithChunks(
      { snippetId, path: "path-0" },
      { snippetId, path: "path-1" }
    );
    const paths = getSnippetPaths(state, snippetId);
    expect(paths).toContain("path-0");
    expect(paths).toContain("path-1");
  });
});
