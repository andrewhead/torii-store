import { Undoable } from "../..";
import { deleteItem } from "../../common/reducers";
import { ChunkVersions, MergeAction, MergeStrategy } from "../types";

export function merge(state: Undoable, action: MergeAction) {
  return {
    ...state,
    /*
     * TODO(andrewhead): Also need to remove this chunk version from the chunk 'versions' list.
     */
    snippets: mergeSnippets(state, action),
    chunkVersions: mergeChunkVersions(state.chunkVersions, action)
  };
}

function mergeSnippets(state: Undoable, action: MergeAction) {
  const snippets = state.snippets;
  const snippet = { ...snippets.byId[action.snippetId] };
  let chunkVersionsAdded = [...snippet.chunkVersionsAdded];
  const index = chunkVersionsAdded.indexOf(action.chunkVersionId);
  if (index !== -1) {
    chunkVersionsAdded.splice(index, 1);
    if (action.replaceMergedVersion) {
      chunkVersionsAdded = chunkVersionsAdded
        .slice(0, index)
        .concat(action.into)
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

function mergeChunkVersions(state: ChunkVersions, action: MergeAction) {
  const chunkVersion = state.byId[action.chunkVersionId];
  const into = state.byId[action.into];
  let text;
  if (action.strategy === MergeStrategy.SAVE_CHANGES) {
    text = chunkVersion.text;
  } else {
    text = into.text;
  }
  state = {
    ...state,
    byId: {
      ...state.byId,
      [action.into]: {
        ...into,
        text
      }
    }
  };
  return deleteItem(state, action.chunkVersionId);
}
