import * as actions from "../../../src/outputs/actions";
import { outputActionNames as names } from "../../../src/outputs/types";

describe("actions", () => {
  it("should create an action for starting an execution", () => {
    const snippetId = "snippet-id";
    const commandId = "command-id";
    const type = "console";
    const expectedAction = {
      snippetId,
      commandId,
      outputType: type,
      type: names.START_EXECUTION
    };
    const action = actions.startExecution(snippetId, commandId, type);
    expect(action).toMatchObject(expectedAction);
  });

  it("should create an action for updating an execution", () => {
    const snippetId = "snippet-id";
    const commandId = "command-id";
    const log = {
      contents: "output\nerror",
      stdoutRanges: [{ start: 0, end: 7 }],
      stderrRanges: [{ start: 7, end: 13 }]
    };
    const expectedAction = {
      snippetId,
      commandId,
      log,
      type: names.UPDATE_EXECUTION
    };
    expect(actions.updateExecution(snippetId, commandId, log)).toEqual(expectedAction);
  });

  it("should create an action for finishing an execution", () => {
    const snippetId = "snippet-id";
    const commandId = "command-id";
    const log = {
      contents: "output\nerror",
      stdoutRanges: [{ start: 0, end: 7 }],
      stderrRanges: [{ start: 7, end: 13 }]
    };
    const value = "result";
    const expectedAction = {
      snippetId,
      commandId,
      log,
      value,
      type: names.FINISH_EXECUTION
    };
    expect(actions.finishExecution(snippetId, commandId, log, value)).toEqual(expectedAction);
  });
});
