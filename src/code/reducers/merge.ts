import { Undoable } from "../..";
import { deleteItem } from "../../common/reducers";
import { findIdOfPreviousChunkVersion, getSnippetIdsInCellOrder } from "../../selectors/code";
import { ChunkVersionId, ChunkVersions, MergeAction, MergeStrategy, SnippetId } from "../types";

export function merge(state: Undoable, action: MergeAction) {
  const previousChunkVersionId = findIdOfPreviousChunkVersion(
    state,
    action.snippetId,
    action.chunkVersionId
  );
  return {
    ...state,
    /*
     * TODO(andrewhead): Also need to remove this chunk version from the chunk 'versions' list.
     */
    snippets: mergeSnippets(state, action, previousChunkVersionId),
    chunkVersions: mergeChunkVersions(state.chunkVersions, action, previousChunkVersionId)
  };
}

function mergeSnippets(
  state: Undoable,
  action: MergeAction,
  previousChunkVersionId: ChunkVersionId
) {
  const isPreviousVersionInCells = isChunkVersionInCells(
    state,
    action.snippetId,
    previousChunkVersionId
  );
  const snippets = state.snippets;
  const snippet = { ...snippets.byId[action.snippetId] };
  let chunkVersionsAdded = [...snippet.chunkVersionsAdded];
  const index = chunkVersionsAdded.indexOf(action.chunkVersionId);
  if (index !== -1) {
    chunkVersionsAdded.splice(index, 1);
    if (!isPreviousVersionInCells) {
      chunkVersionsAdded = chunkVersionsAdded
        .slice(0, index)
        .concat(previousChunkVersionId)
        .concat(chunkVersionsAdded.slice(index, chunkVersionsAdded.length));
    }
  }
  snippet.chunkVersionsAdded = chunkVersionsAdded;
  return {
    ...snippets,
    byId: {
      ...snippets.byId,
      [action.snippetId]: snippet
    }
  };
}

function isChunkVersionInCells(
  state: Undoable,
  beforeSnippetId: SnippetId,
  chunkVersionId: ChunkVersionId
): boolean {
  const orderedSnippetIds = getSnippetIdsInCellOrder(state);
  const snippetIndex = orderedSnippetIds.indexOf(beforeSnippetId);
  for (let i = snippetIndex - 1; i >= 0; i--) {
    const snippet = state.snippets.byId[state.snippets.all[i]];
    if (snippet.chunkVersionsAdded.indexOf(chunkVersionId) !== -1) {
      return true;
    }
  }
  return false;
}

function mergeChunkVersions(
  state: ChunkVersions,
  action: MergeAction,
  previousChunkVersionId: ChunkVersionId | null
) {
  const chunkVersion = state.byId[action.chunkVersionId];
  if (previousChunkVersionId !== null) {
    const previousVersion = state.byId[previousChunkVersionId];
    let text;
    if (action.strategy === MergeStrategy.SAVE_CHANGES) {
      text = chunkVersion.text;
    } else {
      text = previousVersion.text;
    }
    state = {
      ...state,
      byId: {
        ...state.byId,
        [previousChunkVersionId]: {
          ...previousVersion,
          text
        }
      }
    };
  }
  return deleteItem(state, action.chunkVersionId);
}
