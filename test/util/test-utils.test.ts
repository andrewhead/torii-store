import { createState } from "../../src/util/test-utils";

describe("createState", () => {
  it("creates an empty state", () => {
    expect(createState()).toMatchObject({
      undoable: {
        present: {
          snippets: { all: [], byId: {} }
        }
      }
    });
  });

  it("creates a state with a nested property", () => {
    const partialState = {
      undoable: {
        present: {
          snippets: {
            all: ["snippet-0"],
            byId: {
              "snippet-0": {
                chunkVersionsAdded: []
              }
            }
          }
        }
      }
    };
    expect(createState(partialState)).toMatchObject(partialState);
  });
});
