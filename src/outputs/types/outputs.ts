import { SimpleStore } from "../../common/types";
import { SnippetId } from "../../text/types";

export interface Outputs extends SimpleStore<SnippetId, SnippetOutputs[]> {}

/**
 * Dictionary mapping from a command ID to the output produced by it.
 */
export interface SnippetOutputs {
  [commandId: string]: Output;
}

/**
 * An output produced by running a command on the code for a snippet.
 */
export interface Output {
  /**
   * ID of a command that produced the output.
   */
  commandId: CommandId;
  /**
   * State of running the command (i.e. is it running, or has it finished running?)
   * When RUNNING, 'log' and 'value' will be undefined. When FINISHED, all fields will be defined.
   */
  state: CommandState;
  /**
   * Type of output, indicates how the output should be rendered. See 'OutputType'
   */
  type: OutputType;
  /**
   * Console output and errors produced while the emitter was running.
   */
  log?: ConsoleLog;
  /**
   * The output.
   */
  value?: string;
}

export type CommandState = typeof RUNNING | typeof FINISHED;

const RUNNING = "running";
const FINISHED = "finished";

export type OutputType = typeof CONSOLE | typeof HTML;

const CONSOLE = "console";
const HTML = "html";

/**
 * A log of all console output produced by an execution. Output and error streams should be
 * combined into 'contents'. 'stdoutRanges' and 'stderrRanges' should indicate which parts
 * of the log are output and which parts are error.
 */
export interface ConsoleLog {
  /**
   * Contents of output from console.
   */
  contents: string;
  stdoutRanges: CharacterRange[];
  stderrRanges: CharacterRange[];
}

/**
 * Range of characters in a buffer.
 */
interface CharacterRange {
  /**
   * First character is 0.
   */
  start: number;
  /**
   * 1 more than the index of the last character in the range.
   */
  end: number;
}

export type OutputId = string;

export type CommandId = string;
