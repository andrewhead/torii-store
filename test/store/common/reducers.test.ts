import { move } from "../../../src/common/reducers";

describe("move", () => {
  const all = ["id0", "id1", "id2"];
  const state = { all, byId: { id0: {}, id1: {}, id2: {} } };

  it("moves elements forward in a list", () => {
    expect(move(state, "id1", 2).all).toEqual(["id0", "id2", "id1"]);
  });

  it("moves elements back in a list", () => {
    expect(move(state, "id1", 0).all).toEqual(["id1", "id0", "id2"]);
  });

  it("does nothing if element doesn't exist", () => {
    expect(move(state, "missing-id", 3).all).toEqual(all);
  });
});
