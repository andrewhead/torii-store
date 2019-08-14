import { AnyAction, combineReducers, createStore as reduxCreateStore, Store } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import undoable from "redux-undo";
import * as textActionNames from "./text/action-names";
import * as textActions from "./text/actions";
import { textReducer } from "./text/reducers";
import { Text, TextActionTypes } from "./text/types";

export const rootReducer = combineReducers({
  text: undoable(textReducer)
});

export const createStore = (): Store<State, AnyAction> => {
  return reduxCreateStore(rootReducer, undefined, devToolsEnhancer({}));
};
export const store = createStore();

export type State = ReturnType<typeof rootReducer>;

export { Text };

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
