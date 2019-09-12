import _ from "lodash";
import { Undoable } from "../../state/types";
import { ChunkVersionId, PickChunkVersionAction, Snippet } from "../types";

export function pickChunkVersion(state: Undoable, action: PickChunkVersionAction) {
  const snippet = state.snippets.byId[action.snippetId];
  const chunk = state.chunks.byId[action.chunkId];
  let removeChunkVersionId = undefined;
  for (const chunkVersionId of snippet.chunkVersionsAdded) {
    if (chunk.versions.indexOf(chunkVersionId) !== -1) {
      removeChunkVersionId = chunkVersionId;
      break;
    }
  }
  let updatedSnippet = { ...snippet };
  if (removeChunkVersionId !== undefined) {
    updatedSnippet = removeChunkVersionFromSnippet(snippet, removeChunkVersionId);
  }
  const updatedForSnippet = { ...state.visibilityRules[action.snippetId] };
  if (state.visibilityRules[action.snippetId] !== undefined) {
    for (const chunkVersionId of Object.keys(state.visibilityRules[action.snippetId])) {
      const chunkId = state.chunkVersions.byId[chunkVersionId].chunk;
      if (chunkId === action.chunkId) {
        updatedForSnippet[chunkVersionId] = undefined;
      }
    }
  }
  updatedSnippet = {
    ...updatedSnippet,
    chunkVersionsAdded: updatedSnippet.chunkVersionsAdded.concat(action.chunkVersionId)
  };
  const updated = _.merge({}, state, {
    snippets: {
      byId: {
        [action.snippetId]: updatedSnippet
      }
    }
  });
  updated.visibilityRules = {
    ...updated.visibilityRules,
    [action.snippetId]: updatedForSnippet
  };
  return updated;
}

function removeChunkVersionFromSnippet(snippet: Snippet, chunkVersionId: ChunkVersionId) {
  const chunkVersionsAdded = [...snippet.chunkVersionsAdded];
  const removeIndex = chunkVersionsAdded.indexOf(chunkVersionId);
  if (removeIndex !== -1) {
    chunkVersionsAdded.splice(removeIndex, 1);
  }
  return {
    ...snippet,
    chunkVersionsAdded
  };
}
