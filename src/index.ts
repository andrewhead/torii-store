import {
  AnyAction,
  combineReducers,
  createStore as reduxCreateStore,
  DeepPartial,
  Store
} from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";

export const rootReducer = combineReducers({
  /* undoable: undoable() */
})

export const createStore = (
  initialState?: DeepPartial<State>
): Store<State, AnyAction> => {
  return reduxCreateStore(rootReducer, initialState, devToolsEnhancer({}));
};
export const store = createStore();

export type State = ReturnType<typeof rootReducer>;

/*
export interface State {
  lineVersions: {
    allLineVersions: AllLineVersions;
    byId: LineVersionsById;
  };
  lines: {
    allLines: AllLines;
    byId: LinesById;
  };
  steps: {
    allSteps: AllSnippets;
    byId: SnippetsById;
  };
}
*/

/*
export function toPresentState(state: UndoableState) {
  return {
    lineVersions: {
      allLineVersions: state.lineVersions.allLineVersions.present,
      byId: state.lineVersions.byId.present
    },
    lines: {
      allLines: state.lines.allLines.present,
      byId: state.lines.byId.present
    },
    steps: {
      allSteps: state.steps.allSnippets.present,
      byId: state.steps.byId.present
    }
  };
}
*/

/*
export { Line, Snippet };
*/

export namespace actions {
  export namespace Type {
    /*
    export type Line = LineActionTypes;
    export type Step = SnippetActionTypes;
    export type Any = LineActionTypes | SnippetActionTypes;
    */
  }

  export namespace Name {
    /*
    export const line = lineActionNames;
    export const step = stepActionNames;
    */
  }

  /*
  export const line = lineActions;
  export const step = stepActions;
  */
}
