import _ from "lodash";
import { simpleStoreInitialState } from "../../../src/common/reducers";
import * as actions from "../../../src/outputs/actions";
import { outputsReducer } from "../../../src/outputs/reducers";
import { CommandId, ConsoleLog } from "../../../src/outputs/types";
import { SnippetId } from "../../../src/text/types";

describe("outputsReducer", () => {
  describe("should handle START_EXECUTION", () => {
    it("should create an empty output", () => {
      const action = actions.startExecution("snippet-id", "command-id", "console");
      const outputs = outputsReducer(undefined, action);
      expect(outputs).toMatchObject({
        all: ["snippet-id"],
        byId: {
          "snippet-id": {
            "command-id": {
              commandId: "command-id",
              type: "console",
              state: "running"
            }
          }
        }
      });
      expect(outputs.byId["snippet-id"]["command-id"].log).toBe(undefined);
      expect(outputs.byId["snippet-id"]["command-id"].value).toBe(undefined);
    });

    it("should erase the last output for the snippet and command", () => {
      const initialOutputs = createInitialOutputs(
        "snippet-id",
        "command-id",
        {
          contents: "",
          stdoutRanges: [],
          stderrRanges: []
        },
        ""
      );
      const action = actions.startExecution("snippet-id", "command-id", "console");
      const outputs = outputsReducer(initialOutputs, action);
      expect(outputs).toEqual({
        all: ["snippet-id"],
        byId: {
          "snippet-id": {
            "command-id": {
              commandId: "command-id",
              type: "console",
              state: "running"
            }
          }
        }
      });
      expect(outputs.byId["snippet-id"]["command-id"].log).toBe(undefined);
      expect(outputs.byId["snippet-id"]["command-id"].value).toBe(undefined);
    });
  });

  describe("should handle UPDATE_EXECUTION", () => {
    it("should set the console logs", () => {
      const log = {
        contents: "output\nerror",
        stdoutRanges: [{ start: 0, end: 7 }],
        stderrRanges: [{ start: 7, end: 13 }]
      };
      const initialOutputs = createInitialOutputs("snippet-id", "command-id", log);
      const action = actions.updateExecution("snippet-id", "command-id", log);
      expect(outputsReducer(initialOutputs, action)).toMatchObject({
        byId: {
          "snippet-id": {
            "command-id": {
              state: "running",
              log
            }
          }
        }
      });
    });
  });

  describe("should handle FINISH_EXECUTION", () => {
    it("should set the console logs and value", () => {
      const log = {
        contents: "output\nerror",
        stdoutRanges: [{ start: 0, end: 7 }],
        stderrRanges: [{ start: 7, end: 13 }]
      };
      const result = "result";
      const initialOutputs = createInitialOutputs("snippet-id", "command-id");
      const action = actions.finishExecution("snippet-id", "command-id", log, result);
      expect(outputsReducer(initialOutputs, action)).toMatchObject({
        byId: {
          "snippet-id": {
            "command-id": {
              state: "finished",
              log,
              value: result
            }
          }
        }
      });
    });
  });
});

function createInitialOutputs(
  snippetId: SnippetId,
  commandId: CommandId,
  log?: ConsoleLog,
  value?: string
) {
  return _.merge({}, simpleStoreInitialState(), {
    all: [snippetId],
    byId: {
      [snippetId]: {
        [commandId]: {
          commandId,
          type: "console",
          state: "running",
          log,
          value
        }
      }
    }
  });
}
