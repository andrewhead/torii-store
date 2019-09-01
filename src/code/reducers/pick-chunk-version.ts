import _ from "lodash";
import { Undoable } from "../../types";
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
  updatedSnippet = {
    ...updatedSnippet,
    chunkVersionsAdded: updatedSnippet.chunkVersionsAdded.concat(action.chunkVersionId)
  };
  return _.merge({}, state, {
    snippets: {
      byId: {
        [action.snippetId]: updatedSnippet
      }
    }
  });
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
