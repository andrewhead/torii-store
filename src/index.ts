import reduceReducers from "reduce-reducers";
import { AnyAction, combineReducers, createStore as reduxCreateStore, Store } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import undoable from "redux-undo";
import * as cellActions from "./cells/actions";
import { cellsReducer } from "./cells/reducers";
import { Cell, cellActionNames, CellActionTypes, CellId, Cells, ContentType } from "./cells/types";
import * as codeActions from "./code/actions";
import { codeReducer } from "./code/reducers";
import {
  Chunk,
  ChunkId,
  ChunkVersion,
  ChunkVersionId,
  codeActionNames,
  CodeActionTypes,
  InitialChunk,
  Path,
  Position,
  Range,
  Selection,
  Snippet,
  SnippetId,
  SourcedRange,
  SourceType,
  visibility
} from "./code/types";
import * as outputActions from "./outputs/actions";
import { outputsReducer } from "./outputs/reducers";
import {
  CommandId,
  CommandState,
  ConsoleLog,
  Output,
  outputActionNames,
  OutputActionTypes,
  OutputId,
  OutputType,
  OutputTypes
} from "./outputs/types";
import * as selectors from "./selectors";
import { FileContents } from "./selectors/types";
import { Undoable } from "./types";
import * as uiUndoableActions from "./ui-undoable/actions";
import { uiUndoableActionNames, UiUndoableActionTypes } from "./ui-undoable/types";
import * as stateUtils from "./util/state-utils";
import * as testUtils from "./util/test-utils";
import * as textUtils from "./util/text-utils";

/**
 * Number of undo's stored in the history. This is a small number of steps, and could probably
 * be increased if undo's were stored as deltas, and not snapshots. In addition, it might
 * be increased if some actions are filtered out from creating new snapshots (e.g., selections).
 */
const UNDO_LIMIT = 10;

export const rootReducer = combineReducers({
  outputs: outputsReducer,
  undoable: undoable(reduceReducers(codeReducer, cellsReducer), { limit: UNDO_LIMIT })
});

export const createStore = (): Store<State, AnyAction> => {
  return reduxCreateStore(rootReducer, undefined, devToolsEnhancer({}));
};
export const store = createStore();

export type State = ReturnType<typeof rootReducer>;

export namespace actions {
  export namespace Type {
    export type Cells = CellActionTypes;
    export type Code = CodeActionTypes;
    export type Outputs = OutputActionTypes;
    export type Ui = UiUndoableActionTypes;
    export type Any = CellActionTypes | CodeActionTypes | OutputActionTypes;
  }

  export namespace Name {
    export const cells = cellActionNames;
    export const code = codeActionNames;
    export const outputs = outputActionNames;
    export const ui = uiUndoableActionNames;
  }

  export const cells = cellActions;
  export const code = codeActions;
  export const outputs = outputActions;
  export const ui = uiUndoableActions;
}

export {
  Cell,
  CellId,
  Cells,
  Chunk,
  ChunkId,
  ChunkVersion,
  ChunkVersionId,
  CommandId,
  CommandState,
  ConsoleLog,
  ContentType,
  FileContents,
  InitialChunk,
  Output,
  OutputId,
  OutputType,
  OutputTypes,
  Path,
  Position,
  Range,
  Selection,
  selectors,
  Snippet,
  SnippetId,
  SourcedRange,
  SourceType,
  stateUtils,
  Undoable,
  testUtils,
  textUtils,
  visibility
};
