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

export function mergeCodeUpdates(...codeUpdatesItems: CodeUpdates[]) {
  return {
    chunks: mergeUpdates(...codeUpdatesItems.map(t => t.chunks)),
    chunkVersions: mergeUpdates(...codeUpdatesItems.map(t => t.chunkVersions)),
    snippets: mergeUpdates(...codeUpdatesItems.map(t => t.snippets)),
    visibilityRules: mergeUpdates(...codeUpdatesItems.map(t => t.visibilityRules))
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

export function emptyCodeUpdates(): CodeUpdates {
  return {
    chunks: emptyUpdates(),
    chunkVersions: emptyUpdates(),
    snippets: emptyUpdates(),
    visibilityRules: emptyUpdates()
  };
}

export interface CodeUpdates {
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
