import { AnyAction, combineReducers, createStore as reduxCreateStore, Store } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import undoable from "redux-undo";
import * as textUtils from "./text-utils";
import * as textActionNames from "./text/action-names";
import * as textActions from "./text/actions";
import { Chunk, ChunkId, ChunkVersion, ChunkVersionId, Path } from "./text/chunks/types";
import { textReducer } from "./text/reducers";
import { Snippet, SnippetId, visibility } from "./text/snippets/types";
import { Position, Range, Selection, SourceType, Text, TextActionTypes } from "./text/types";

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
  SnippetId,
  ChunkId,
  ChunkVersionId,
  Snippet,
  Chunk,
  ChunkVersion,
  Text,
  textUtils,
  visibility,
  Path,
  Position,
  Range,
  Selection,
  SourceType
};
