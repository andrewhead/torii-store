import { AnyAction } from "redux";
import { cellActionNames, ContentType, isCellAction } from "../../cells/types";
import { deleteItem } from "../../common/reducers";
import { initialUndoableState, Undoable } from "../../state/types";
import { codeActionNames as actionNames, isCodeAction } from "../types";
import { insertSnippet } from "./create-snippet";
import { edit } from "./edit";
import { fork } from "./fork";
import { merge } from "./merge";
import { pickChunkVersion } from "./pick-chunk-version";
import { uploadFileContents } from "./upload-file-contents";

/**
 * Semantics that are not yet supported (but that should be).
 *
 * High priority
 * =============
 * - Chunks should get added on "add-chunk", removed and split on remove.
 *   - Merge adjacent cells
 * - When chunk version is picked in a snippet, visibility rules for references to that chunk
 *   version in future snippets should be updatd too
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
export function codeReducer(state: Undoable = initialUndoableState, action: AnyAction) {
  if (isCodeAction(action)) {
    switch (action.type) {
      case actionNames.UPLOAD_FILE_CONTENTS:
        return uploadFileContents(state, action);
      case actionNames.INSERT_SNIPPET:
        return insertSnippet(state, action);
      case actionNames.FORK:
        return fork(state, action);
      case actionNames.PICK_CHUNK_VERSION:
        return pickChunkVersion(state, action);
      case actionNames.MERGE:
        return merge(state, action);
      case actionNames.EDIT:
        return edit(state, action);
      case actionNames.SET_SELECTIONS:
        return {
          ...state,
          selections: action.selections
        };
      default:
        return state;
    }
  } else if (isCellAction(action)) {
    switch (action.type) {
      case cellActionNames.DELETE:
        if (action.contentType === ContentType.SNIPPET) {
          return {
            ...state,
            snippets: deleteItem(state.snippets, action.contentId)
          };
        }
        return state;
    }
  }
  return state;
}
