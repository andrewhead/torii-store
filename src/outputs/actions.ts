import { SnippetId } from "../text/types";
import {
  CommandId,
  ConsoleLog,
  FinishExecutionAction,
  outputActionNames as names,
  OutputType,
  StartExecutionAction,
  UpdateExecutionAction
} from "./types";

export function startExecution(snippetId: SnippetId, commandId: CommandId): StartExecutionAction {
  return {
    snippetId,
    commandId,
    type: names.START_EXECUTION
  };
}

export function updateExecution(
  snippetId: SnippetId,
  commandId: CommandId,
  log: ConsoleLog
): UpdateExecutionAction {
  return {
    snippetId,
    commandId,
    log,
    type: names.UPDATE_EXECUTION
  };
}

export function finishExecution(
  snippetId: SnippetId,
  commandId: CommandId,
  log: ConsoleLog,
  type: OutputType,
  value: string
): FinishExecutionAction {
  return {
    snippetId,
    commandId,
    log,
    outputType: type,
    value,
    type: names.FINISH_EXECUTION
  };
}
