import { ContentType } from "../../src";
import { insertIndex } from "../../src/common/actions";
import { createState } from "../../src/util/state-utils";
import { createStateWithUndoable } from "../../src/util/test-utils";

describe("insertIndex", () => {
  it("is the input if it's a number", () => {
    expect(insertIndex(1)).toBe(1);
  });

  describe("if the input is state", () => {
    it("is after the selected cell", () => {
      const state = createStateWithUndoable({
        selectedCell: "cell-1",
        cells: {
          all: ["cell-0", "cell-1", "cell-2"],
          byId: {
            "cell-0": { type: ContentType.SNIPPET, contentId: "snippet-0" },
            "cell-1": { type: ContentType.SNIPPET, contentId: "snippet-1" },
            "cell-2": { type: ContentType.SNIPPET, contentId: "snippet-2" }
          }
        }
      });
      expect(insertIndex(state)).toBe(2);
    });

    it("is at the beginning if no cell was selected", () => {
      const state = createState();
      expect(insertIndex(state)).toBe(0);
    });
  });
});
