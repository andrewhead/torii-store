import reduceReducers from "reduce-reducers";
import { AnyAction, combineReducers, createStore as reduxCreateStore, Store } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import undoable from "redux-undo";
import * as cellActions from "./cells/actions";
import { cellsReducer } from "./cells/reducers";
import {
  Cell,
  cellActionNames,
  CellActionTypes,
  CellId,
  Cells,
  ContentId,
  ContentType
} from "./cells/types";
import * as outputActions from "./outputs/actions";
import { outputsReducer } from "./outputs/reducers";
import {
  CommandId,
  CommandState,
  ConsoleLog,
  Output,
  outputActionNames,
  OutputActionTypes,
  OutputType,
  OutputTypes
} from "./outputs/types";
import * as selectors from "./selectors";
import { FileContents } from "./selectors/types";
import * as textActions from "./text/actions";
import { textReducer } from "./text/reducers";
import {
  Chunk,
  ChunkId,
  ChunkVersion,
  ChunkVersionId,
  InitialChunk,
  Path,
  Position,
  Range,
  Selection,
  Snippet,
  SnippetId,
  SourcedRange,
  SourceType,
  textActionNames,
  TextActionTypes,
  visibility
} from "./text/types";
import { Undoable } from "./types";
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
  undoable: undoable(reduceReducers(textReducer, cellsReducer), { limit: UNDO_LIMIT })
});

export const createStore = (): Store<State, AnyAction> => {
  return reduxCreateStore(rootReducer, undefined, devToolsEnhancer({}));
};
export const store = createStore();

export type State = ReturnType<typeof rootReducer>;

export namespace actions {
  export namespace Type {
    export type Cells = CellActionTypes;
    export type Text = TextActionTypes;
    export type Outputs = OutputActionTypes;
    export type Any = CellActionTypes | TextActionTypes | OutputActionTypes;
  }

  export namespace Name {
    export const cells = cellActionNames;
    export const text = textActionNames;
    export const outputs = outputActionNames;
  }

  export const cells = cellActions;
  export const text = textActions;
  export const outputs = outputActions;
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
  ContentId,
  ContentType,
  FileContents,
  InitialChunk,
  Output,
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
