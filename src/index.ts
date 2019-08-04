import { AnyAction, combineReducers, createStore as reduxCreateStore, DeepPartial, Store } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import * as lineActions from "./lines/actions";
import { undoableLinesReducer, undoableLineVersionsReducer } from "./lines/reducers";
import * as lineTypes from "./lines/types";
import { AllLines, AllLineVersions, Line, LinesById, LineVersionsById } from "./lines/types";
import * as stepActions from "./steps/actions";
import { undoableStepsReducer } from "./steps/reducers";
import * as stepTypes from "./steps/types";
import { AllSteps, Step, StepsById } from "./steps/types";

export const rootReducer = combineReducers({
  lineVersions: undoableLineVersionsReducer,
  lines: undoableLinesReducer,
  steps: undoableStepsReducer
});

export const createStore = (
  initialState?: DeepPartial<UndoableState>
): Store<UndoableState, AnyAction> => {
  return reduxCreateStore(rootReducer, initialState, devToolsEnhancer({}));
};
export const store = createStore();

export type UndoableState = ReturnType<typeof rootReducer>;

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
    allSteps: AllSteps;
    byId: StepsById;
  };
}

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
      allSteps: state.steps.allSteps.present,
      byId: state.steps.byId.present
    }
  };
}


export { Line, Step };
export { lineActions, stepActions };
export { lineTypes, stepTypes };
