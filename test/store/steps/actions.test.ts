import * as actions from "../../../src/steps/actions";
import * as names from "../../../src/steps/action-names";

describe("actions", () => {
  it("should create an action for creating a step", () => {
    const index = 0;
    const action = actions.createStep(index);
    expect(action).toMatchObject({
      index,
      type: names.CREATE_STEP
    });
    expect(action.id).toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    );
  });

  it("should create an action for adding a line", () => {
    const lineVersionId = "line-version-id";
    const stepId = "step-id";
    const expectedAction = {
      lineVersionId,
      stepId,
      type: names.ADD_LINE_TO_STEP
    };
    expect(actions.addLine(stepId, lineVersionId)).toEqual(expectedAction);
  });
});
