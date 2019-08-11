describe("helpers", () => {
  it("should add snippets", () => {

  });

  it("should not include lines already added", () => {

  });
});

/*
import { addChunk, createSnippet } from "../../../../src/text/snippets/actions";
import { allSnippetsReducer, snippetsByIdReducer } from "../../../../src/text/snippets/reducers";

describe("all snippets reducer", () => {

  describe("should handle CREATE_SNIPPET", () => {
    it("should insert a snippet at the index", () => {
      const allSteps = ["0"];
      const createStepAction = createSnippet(0);
      expect(
        allSnippetsReducer(allSteps, createStepAction)
      ).toEqual([createStepAction.id, "0"]);
    });
  });
});

describe("snippets by ID reducer", () => {

  describe("should handle CREATE_SNIPPET", () => {
    it("should add a snippet", () => {
      const snippetsById = {};
      const updatedStepsById = snippetsByIdReducer(snippetsById, createSnippet(0));
      expect(
        Object.keys(updatedStepsById)
      ).toHaveLength(1);
    });
  });

  describe("should handle ADD_CHUNK_TO_SNIPPET", () => {
    it("should add a chunk", () => {
      const snippetsById = {
        "snippet-id": {
          chunkVersionsAdded: []
        }
      };
      expect(
        snippetsByIdReducer(snippetsById, addChunk("snippet-id", "chunk-version-id"))
      ).toEqual({
        "snippet-id": {
          chunkVersionsAdded: ["chunk-version-id"]
        }
      });
    });

    it("should merge with old chunks", () => {
      expect(false).toBe(true);
    })
  });
});
*/