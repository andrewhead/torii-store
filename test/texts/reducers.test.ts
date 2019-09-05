import * as cellActions from "../../src/cells/actions";
import { ContentType } from "../../src/cells/types";
import * as textActions from "../../src/texts/actions";
import { textsReducer } from "../../src/texts/reducers";
import { createUndoable } from "../../src/util/test-utils";

describe("texts reducer", () => {
  describe("should handle INSERT_TEXT", () => {
    it("should add a text", () => {
      const state = createUndoable();
      const action = cellActions.insertText(0);
      expect(textsReducer(state, action)).toMatchObject({
        texts: {
          all: [action.textId],
          byId: {
            [action.textId]: {
              value: undefined
            }
          }
        }
      });
    });
  });

  describe("should handle SET_TEXT", () => {
    it("should set text", () => {
      const textId = "text-id";
      const state = createUndoable({
        texts: {
          all: [textId],
          byId: {
            [textId]: {
              value: "Old value"
            }
          }
        }
      });
      expect(textsReducer(state, textActions.setText(textId, "New value"))).toMatchObject({
        texts: {
          byId: {
            [textId]: { value: "New value" }
          }
        }
      });
    });
  });

  describe("should handle DELETE", () => {
    it("should delete text", () => {
      const textId = "text-id";
      const state = createUndoable({
        texts: {
          all: [textId],
          byId: {
            [textId]: {
              value: "Old value"
            }
          }
        }
      });
      const updatedState = textsReducer(
        state,
        cellActions.deleteCell("cell-0", ContentType.TEXT, "text-id")
      );
      expect(updatedState.texts.all).toEqual([]);
      expect(updatedState.cells.byId).toEqual({});
    });
  });
});
