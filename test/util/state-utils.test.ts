import { createState, deferrable } from "../../src/util/state-utils";

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
