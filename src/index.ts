import { AnyAction, createStore as reduxCreateStore, DeepPartial, Store } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import * as cellActions from "./cells/actions";
import { Cell, cellActionNames, CellActionTypes, CellId, Cells, ContentType } from "./cells/types";
import * as codeActions from "./code/actions";
import {
  Chunk,
  ChunkId,
  ChunkVersion,
  ChunkVersionId,
  codeActionNames,
  CodeActionTypes,
  InitialChunk,
  MergeStrategy,
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
import * as stateActions from "./state/actions";
import { rootReducer } from "./state/reducers";
import { State, stateActionNames, StateActionTypes, Undoable } from "./state/types";
import * as textActions from "./texts/actions";
import { textActionNames, TextActionTypes, TextId } from "./texts/types";
import * as uiUndoableActions from "./ui-undoable/actions";
import { uiUndoableActionNames, UiUndoableActionTypes } from "./ui-undoable/types";
import * as stateUtils from "./util/state-utils";
import * as testUtils from "./util/test-utils";
import * as textUtils from "./util/text-utils";

export const createStore = (preloadedState?: DeepPartial<State>): Store<State, AnyAction> => {
  return reduxCreateStore(rootReducer, preloadedState, devToolsEnhancer({}));
};
export const store = createStore();

export namespace actions {
  export namespace Type {
    export type Cells = CellActionTypes;
    export type Code = CodeActionTypes;
    export type Texts = TextActionTypes;
    export type Outputs = OutputActionTypes;
    export type Ui = UiUndoableActionTypes;
    export type State = StateActionTypes;
    export type Any = Cells | Code | Texts | Outputs | Ui | State;
  }

  export namespace Name {
    export const cells = cellActionNames;
    export const code = codeActionNames;
    export const text = textActionNames;
    export const outputs = outputActionNames;
    export const ui = uiUndoableActionNames;
    export const state = stateActionNames;
  }

  export const cells = cellActions;
  export const code = codeActions;
  export const texts = textActions;
  export const outputs = outputActions;
  export const ui = uiUndoableActions;
  export const state = stateActions;
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
  MergeStrategy,
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
  State,
  stateUtils,
  TextId,
  Undoable,
  testUtils,
  textUtils,
  visibility
};
