import { AnyAction, combineReducers, createStore as reduxCreateStore, Store } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import undoable from "redux-undo";
import * as textActionNames from "./text/action-names";
import * as textActions from "./text/actions";
import { Chunk, ChunkId, ChunkVersion, ChunkVersionId, Path } from "./text/chunks/types";
import { textReducer } from "./text/reducers";
import { Snippet, SnippetId, visibility } from "./text/snippets/types";
import { Position, Range, Selection, SourceType, Text, TextActionTypes } from "./text/types";
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
  text: undoable(textReducer, { limit: UNDO_LIMIT })
});

export const createStore = (): Store<State, AnyAction> => {
  return reduxCreateStore(rootReducer, undefined, devToolsEnhancer({}));
};
export const store = createStore();

export type State = ReturnType<typeof rootReducer>;

export namespace actions {
  export namespace Type {
    export type Text = TextActionTypes;
    export type Any = TextActionTypes;
  }

  export namespace Name {
    export const text = textActionNames;
  }

  export const text = textActions;
}

export {
  Chunk,
  ChunkId,
  ChunkVersion,
  ChunkVersionId,
  Path,
  Position,
  Range,
  Selection,
  Snippet,
  SnippetId,
  SourceType,
  stateUtils,
  Text,
  testUtils,
  textUtils,
  visibility
};
