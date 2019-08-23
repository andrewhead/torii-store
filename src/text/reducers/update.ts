import _ from "lodash";
import { ById, Updates } from "../../common/types";
import { emptyUpdates, mergeUpdates } from "../../common/update";
import {
  Chunk,
  ChunkId,
  ChunkVersion,
  ChunkVersionId,
  Snippet,
  SnippetId,
  VisibilityRules
} from "../types";

export function mergeTextUpdates(...textUpdatesItems: TextUpdates[]) {
  return {
    chunks: mergeUpdates(...textUpdatesItems.map(t => t.chunks)),
    chunkVersions: mergeUpdates(...textUpdatesItems.map(t => t.chunkVersions)),
    snippets: mergeUpdates(...textUpdatesItems.map(t => t.snippets)),
    visibilityRules: mergeUpdates(...textUpdatesItems.map(t => t.visibilityRules))
  };
}

export function updateVisibilityRules(state: VisibilityRules, updates: VisibilityRulesUpdates) {
  state = _.merge({}, state, updates.add, updates.update);
  for (const [snippetId, chunkVersionId, line] of updates.delete) {
    delete state[snippetId][chunkVersionId][line];
    if (Object.keys(state[snippetId][chunkVersionId]).length === 0) {
      delete state[snippetId][chunkVersionId];
    }
    if (Object.keys(state[snippetId]).length === 0) {
      delete state[snippetId];
    }
  }
  return state;
}

export function emptyTextUpdates(): TextUpdates {
  return {
    chunks: emptyUpdates(),
    chunkVersions: emptyUpdates(),
    snippets: emptyUpdates(),
    visibilityRules: emptyUpdates()
  };
}

export interface TextUpdates {
  snippets: SnippetsUpdates;
  chunks: ChunksUpdates;
  chunkVersions: ChunkVersionsUpdates;
  visibilityRules: VisibilityRulesUpdates;
}

export interface ChunksUpdates extends Updates<ById<Chunk>, ChunkId> {}

export interface ChunkVersionsUpdates extends Updates<ById<ChunkVersion>, ChunkVersionId> {}

export interface SnippetsUpdates extends Updates<ById<Snippet>, SnippetId> {}

export interface VisibilityRulesUpdates
  extends Updates<VisibilityRules, [SnippetId, ChunkVersionId, number]> {}
