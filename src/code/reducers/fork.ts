import _ from "lodash";
import { insert } from "../../common/reducers";
import { Undoable } from "../../state/types";
import { ChunkId, Chunks, ChunkVersionId, ForkAction } from "../types";

export function fork(state: Undoable, action: ForkAction) {
  const chunkVersion = state.chunkVersions.byId[action.chunkVersionId];
  const newChunkVersion = { ...chunkVersion };
  let updatedChunkId = undefined;
  for (const chunkId of state.chunks.all) {
    const chunk = state.chunks.byId[chunkId];
    if (chunk.versions.indexOf(action.chunkVersionId) !== -1) {
      updatedChunkId = chunkId;
    }
  }
  if (updatedChunkId !== undefined) {
    return _.merge({}, state, {
      chunks: addVersionToChunks(state.chunks, updatedChunkId, action.forkId),
      chunkVersions: insert(state.chunkVersions, action.forkId, 0, newChunkVersion)
    });
  }
}

function addVersionToChunks(state: Chunks, chunkId: ChunkId, chunkVersionId: ChunkVersionId) {
  return _.merge({}, state, {
    byId: {
      [chunkId]: {
        versions: state.byId[chunkId].versions.concat(chunkVersionId)
      }
    }
  });
}
