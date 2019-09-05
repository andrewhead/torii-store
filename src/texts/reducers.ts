import _ from "lodash";
import { AnyAction } from "redux";
import { cellActionNames, ContentType, isCellAction } from "../cells/types";
import { deleteItem, insert } from "../common/reducers";
import { initialUndoableState } from "../state/types";
import { isTextAction, SetTextAction, textActionNames, Texts } from "./types";

export function textsReducer(state = initialUndoableState, action: AnyAction) {
  return {
    ...state,
    texts: textsReducerForTextsSlice(state.texts, action)
  };
}

export function textsReducerForTextsSlice(state: Texts, action: AnyAction) {
  if (isCellAction(action)) {
    switch (action.type) {
      case cellActionNames.INSERT_TEXT:
        return insert(state, action.textId, 0, { value: undefined });
      case cellActionNames.DELETE:
        if (action.contentType === ContentType.TEXT) {
          return deleteItem(state, action.contentId);
        }
        return state;
      default:
        return state;
    }
  } else if (isTextAction(action)) {
    switch (action.type) {
      case textActionNames.SET_TEXT:
        return setText(state, action);
      default:
        return state;
    }
  }
  return state;
}

function setText(state: Texts, action: SetTextAction) {
  return _.merge({}, state, {
    byId: {
      [action.id]: {
        value: action.value
      }
    }
  });
}
