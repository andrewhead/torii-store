import { AnyAction } from "redux";
import { addIdIfMissing, simpleStoreInitialState } from "../common/reducers";
import { ById } from "../common/types";
import { SnippetId } from "../text/types";
import {
  CommandId,
  CommandState,
  FinishExecutionAction,
  isOutputAction,
  Output,
  Outputs,
  SnippetOutputs,
  StartExecutionAction,
  UpdateExecutionAction
} from "./types";
import { FINISH_EXECUTION, START_EXECUTION, UPDATE_EXECUTION } from "./types/action-names";

const initialState = simpleStoreInitialState() as Outputs;

export function outputsReducer(state = initialState, action: AnyAction): Outputs {
  if (isOutputAction(action)) {
    switch (action.type) {
      case START_EXECUTION:
        return startExecution(state, action);
      case UPDATE_EXECUTION:
        return updateExecution(state, action);
      case FINISH_EXECUTION:
        return finishExecution(state, action);
      default:
        return state;
    }
  }
  return state;
}

function startExecution(state: Outputs, action: StartExecutionAction) {
  const output: Output = {
    commandId: action.commandId,
    type: action.outputType,
    state: "started"
  };
  return {
    ...state,
    all: addIdIfMissing(state.all, action.snippetId),
    byId: setOutputInById(state.byId, action.snippetId, action.commandId, output)
  };
}

function updateExecution(state: Outputs, action: UpdateExecutionAction) {
  const output = getOutput(state, action.snippetId, action.commandId);
  if (output !== null) {
    const updatedOutput = { ...output, log: action.log };
    return {
      ...state,
      byId: setOutputInById(state.byId, action.snippetId, action.commandId, updatedOutput)
    };
  }
  return state;
}

function finishExecution(state: Outputs, action: FinishExecutionAction) {
  const output = getOutput(state, action.snippetId, action.commandId);
  if (output !== null) {
    const commandState: CommandState = "finished";
    const updatedOutput = { ...output, state: commandState, log: action.log, value: action.value };
    return {
      ...state,
      byId: setOutputInById(state.byId, action.snippetId, action.commandId, updatedOutput)
    };
  }
  return state;
}

function getOutput(state: Outputs, snippetId: SnippetId, commandId: CommandId): Output | null {
  if (state.byId[snippetId] !== undefined && state.byId[snippetId][commandId] !== undefined) {
    return state.byId[snippetId][commandId];
  }
  return null;
}

function setOutputInById(
  state: ById<SnippetOutputs>,
  snippetId: SnippetId,
  commandId: CommandId,
  output: Output
): ById<SnippetOutputs> {
  return {
    ...state,
    [snippetId]: {
      ...state[snippetId],
      [commandId]: output
    }
  };
}
