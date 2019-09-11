import { AnyAction } from "redux";
import { SnippetId } from "../../code/types";
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

export interface ApplyUpdatesAction {
  type: typeof names.APPLY_UPDATES;
  actions: OutputActionTypes[];
}

export type OutputActionTypes =
  | StartExecutionAction
  | UpdateExecutionAction
  | FinishExecutionAction
  | ApplyUpdatesAction;

export function isOutputAction(action: AnyAction): action is OutputActionTypes {
  return Object.keys(names).indexOf(action.type) !== -1;
}
