import * as actions from "../../../src/lines/actions";
import * as names from "../../../src/lines/action-names";

describe("actions", () => {
  it("should create an action for updating text", () => {
    const lineVersionId = "id";
    const text = "Updated text";
    const expectedAction = {
      lineVersionId,
      text,
      type: names.UPDATE_TEXT
    };
    expect(actions.updateText(lineVersionId, text)).toEqual(expectedAction);
  });

  it("should create an action for updating text at a location", () => {
    const location = { path: "path", index: 0 };
    const text = "Updated text";
    const version = 0;
    const expectedAction = {
      location,
      text,
      version,
      type: names.UPDATE_TEXT_AT_LOCATION
    };
    expect(actions.updateTextAtLocation(location, text, version)).toEqual(expectedAction);
  });

  describe("should create an action for creating a line", () => {
    it("should not insert by default", () => {
      const location = {
        index: 0,
        path: "path"
      };
      const action = actions.createLine(location);
      expect(action).toMatchObject({
        initialVersionId: undefined,
        initialVersionText: undefined,
        insert: false,
        location,
        type: names.CREATE_LINE
      });
      expect(action.id).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    });

    it("should insert lines", () => {
      const location = {
        index: 0,
        path: "path"
      };
      expect(actions.createLine(location, undefined, true)).toMatchObject({
        insert: true
      });
    });

    it("should include initial version information", () => {
      const location = {
        index: 0,
        path: "path"
      };
      const initialVersionText = "Initial text";
      const action = actions.createLine(location, initialVersionText);
      expect(action).toMatchObject({
        initialVersionId: action.initialVersionId,
        initialVersionText
      });
    });
  });
});
