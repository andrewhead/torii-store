import { AnyAction } from "redux";
import { codeActionNames, isCodeAction } from "../code/types";
import { deleteItem, insert, move } from "../common/reducers";
import { initialUndoableState } from "../state/types";
import { cellActionNames, Cells, ContentType, HideAction, isCellAction, ShowAction } from "./types";

export function cellsReducer(state = initialUndoableState, action: AnyAction) {
  /*
   * TODO(andrewhead): refactor to process move of delete cursor into ui-undoable.
   */
  const updated = { ...state };
  if (isCellAction(action)) {
    switch (action.type) {
      case cellActionNames.DELETE:
        const cellIndex = state.cells.all.indexOf(action.id);
        if (cellIndex !== -1 && cellIndex > 0) {
          updated.selectedCell = state.cells.all[cellIndex - 1];
        }
        break;
    }
  }
  return {
    ...updated,
    cells: cellsReducerForCellsSlice(state.cells, action)
  };
}

function cellsReducerForCellsSlice(state: Cells, action: AnyAction) {
  if (isCellAction(action)) {
    switch (action.type) {
      case cellActionNames.INSERT_TEXT:
        return insert(
          state,
          action.cellId,
          action.index,
          createCell(ContentType.TEXT, action.textId)
        );
      case cellActionNames.INSERT_OUTPUT:
        return insert(
          state,
          action.cellId,
          action.index,
          createCell(ContentType.OUTPUT, action.outputId)
        );
      case cellActionNames.MOVE:
        return move(state, action.id, action.to);
      case cellActionNames.DELETE:
        return deleteItem(state, action.id);
      case cellActionNames.SHOW:
        return showCell(state, action);
      case cellActionNames.HIDE:
        return hideCell(state, action);
      default:
        return state;
    }
  } else if (isCodeAction(action)) {
    switch (action.type) {
      case codeActionNames.INSERT_SNIPPET:
        return insert(
          state,
          action.cellId,
          action.index,
          createCell(ContentType.SNIPPET, action.snippetId)
        );
      default:
        return state;
    }
  }
  return state;
}

function createCell(type: ContentType, contentId: any) {
  return {
    type,
    contentId,
    hidden: false
  };
}

function showCell(state: Cells, action: ShowAction) {
  return {
    ...state,
    byId: {
      ...state.byId,
      [action.id]: {
        ...state.byId[action.id],
        hidden: false
      }
    }
  };
}

function hideCell(state: Cells, action: HideAction) {
  return {
    ...state,
    byId: {
      ...state.byId,
      [action.id]: {
        ...state.byId[action.id],
        hidden: true
      }
    }
  };
}
