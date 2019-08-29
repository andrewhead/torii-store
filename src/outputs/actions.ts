import { SnippetId } from "../code/types";
import {
  CommandId,
  ConsoleLog,
  FinishExecutionAction,
  outputActionNames as names,
  OutputType,
  StartExecutionAction,
  UpdateExecutionAction
} from "./types";

export function startExecution(
  snippetId: SnippetId,
  commandId: CommandId,
  type: OutputType
): StartExecutionAction {
  return {
    snippetId,
    commandId,
    outputType: type,
    type: names.START_EXECUTION
  };
}

/**
 * Assumes the execution has already been started with 'startExecution'.
 * Each time this action is created, it should include the full console log in in 'log'. The log is
 * completely changed in the store to whatever the last received 'log' was.
 */
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

/**
 * Assumes the execution has already been started with 'startExecution'.
 */
export function finishExecution(
  snippetId: SnippetId,
  commandId: CommandId,
  log: ConsoleLog,
  value: string
): FinishExecutionAction {
  return {
    snippetId,
    commandId,
    log,
    value,
    type: names.FINISH_EXECUTION
  };
}
