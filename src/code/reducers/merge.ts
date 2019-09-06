import { Undoable } from "../..";
import { deleteItem } from "../../common/reducers";
import { findIdOfPreviousChunkVersion } from "../../selectors/code";
import { ChunkVersionId, ChunkVersions, MergeAction, MergeStrategy, Snippets } from "../types";

export function merge(state: Undoable, action: MergeAction) {
  const previousChunkVersionId = findIdOfPreviousChunkVersion(
    state,
    action.snippetId,
    action.chunkVersionId
  );
  return {
    ...state,
    snippets: removeChunkVersion(state.snippets, action),
    chunkVersions: mergeChunkVersions(state.chunkVersions, action, previousChunkVersionId)
  };
}

function removeChunkVersion(state: Snippets, action: MergeAction) {
  const snippet = { ...state.byId[action.snippetId] };
  const chunkVersionsAdded = [...snippet.chunkVersionsAdded];
  const index = chunkVersionsAdded.indexOf(action.chunkVersionId);
  if (index !== -1) {
    chunkVersionsAdded.splice(index, 1);
  }
  snippet.chunkVersionsAdded = chunkVersionsAdded;
  return {
    ...state,
    byId: {
      ...state.byId,
      [action.snippetId]: snippet
    }
  };
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
