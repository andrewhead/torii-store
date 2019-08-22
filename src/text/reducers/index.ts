import { AnyAction } from "redux";
import * as names from "../action-names";
import { visibilityRulesInitialState } from "../snippets/helpers";
import { isTextAction, Text } from "../types";
import { createSnippet } from "./create-snippet";
import { edit } from "./edit";
import { uploadFileContents } from "./upload-file-contents";

/**
 * Semantics that are not yet supported (but that should be).
 *
 * High priority
 * =============
 * - Chunks should get added on "add-chunk", removed and split on remove.
 *   - Merge adjacent cells
 *
 * Lower priority
 * ==============
 * - Let people split chunks that have later versions of them. Perhaps by better tracking of edits
 *   that have been applied and inference of how later versions should be split. Perhaps by
 *   asking for user input to split the later blocks. At the very least, provide an informative
 *   error message telling them to start again with fresh blocks, or delete the later changes...
 */

/**
 * TODO(andrewhead): This and other reducer functions takes AnyAction as the second argument and
 * checks its type to make sure it is a text action. This is because of a limitation of the
 * undoable library where currently, the type of action is constrained to be "AnyAction". When that
 * bug gets fixed, all of these reducers should be refactored to take a more precise type as the
 * second argument. Follow the issue here: https://github.com/omnidan/redux-undo/issues/229
 */
export function textReducer(state: Text = initialState, action: AnyAction) {
  if (isTextAction(action)) {
    switch (action.type) {
      case names.UPLOAD_FILE_CONTENTS:
        return uploadFileContents(state, action);
      case names.CREATE_SNIPPET:
        return createSnippet(state, action);
      case names.SET_SELECTIONS:
        return {
          ...state,
          selections: action.selections
        };
      case names.EDIT:
        return edit(state, action);
      default:
        return state;
    }
  }
  return state;
}

export const initialState = {
  snippets: simpleStoreInitialState(),
  chunks: simpleStoreInitialState(),
  chunkVersions: simpleStoreInitialState(),
  visibilityRules: visibilityRulesInitialState,
  selections: []
};

function simpleStoreInitialState() {
  return {
    all: [],
    byId: {}
  };
}
