import { AnyAction } from "redux";
import { SnippetId } from "../../text/types";
import * as names from "./action-names";
import { CommandId, ConsoleLog, OutputType } from "./outputs";

export interface StartExecutionAction {
  type: typeof names.START_EXECUTION;
  snippetId: SnippetId;
  commandId: CommandId;
  outputType: OutputType;
}
export interface UpdateExecutionAction {
  type: typeof names.UPDATE_EXECUTION;
  snippetId: SnippetId;
  commandId: CommandId;
  log: ConsoleLog;
}

export interface FinishExecutionAction {
  type: typeof names.FINISH_EXECUTION;
  snippetId: SnippetId;
  commandId: CommandId;
  log: ConsoleLog;
  value: string;
}

export type OutputActionTypes =
  | StartExecutionAction
  | UpdateExecutionAction
  | FinishExecutionAction;

export function isOutputAction(action: AnyAction): action is OutputActionTypes {
  return Object.keys(names).indexOf(action.type) !== -1;
}
