import _ from "lodash";
import { Chunk, ChunkId, ChunkVersion, ChunkVersionId } from "../chunks/types";
import { Snippet, SnippetId, VisibilityRules } from "../snippets/types";
import { ById, SimpleStore } from "../types";

function mergeUpdates<T, K>(...updatesItems: Updates<T, K>[]) {
  return {
    add: _.merge({}, ...updatesItems.map(u => u.add)),
    update: _.merge({}, ...updatesItems.map(u => u.update)),
    delete: updatesItems.reduce((deleteList, item) => {
      return _.unionWith(deleteList, item.delete, _.isEqual);
    }, [])
  };
}

export function mergeTextUpdates(...textUpdatesItems: TextUpdates[]) {
  return {
    chunks: mergeUpdates(...textUpdatesItems.map(t => t.chunks)),
    chunkVersions: mergeUpdates(...textUpdatesItems.map(t => t.chunkVersions)),
    snippets: mergeUpdates(...textUpdatesItems.map(t => t.snippets)),
    visibilityRules: mergeUpdates(...textUpdatesItems.map(t => t.visibilityRules))
  };
}

function updateById<K, T>(state: ById<T>, updates: Updates<ById<T>, K>) {
  const updatedState = {
    ...state,
    ...updates.add,
    ...updates.update
  };
  for (const id of updates.delete) {
    if (typeof id === "string") {
      delete updatedState[id];
    }
  }
  return updatedState;
}

function updateAllList<K extends string>(state: K[], updates: Updates<any, K>): K[] {
  const updatedState = [...state];
  const keys = Object.keys(updates.add).concat(Object.keys(updates.update)) as K[];
  for (const key of keys) {
    if (updatedState.indexOf(key) === -1) {
      updatedState.push(key);
    }
  }
  for (const id of updates.delete) {
    const index = updatedState.indexOf(id);
    if (index !== -1) {
      updatedState.splice(index, 1);
    }
  }
  return updatedState;
}

export function update<K extends string, T>(
  state: SimpleStore<K, T>,
  updates: Updates<ById<T>, K>
): SimpleStore<K, T> {
  return {
    all: updateAllList(state.all, updates),
    byId: updateById(state.byId, updates)
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

function emptyUpdates<T, K>(): Updates<T, K> {
  return {
    add: {} as T,
    update: {} as T,
    delete: [] as K[]
  };
}

export function emptyTextUpdates(): TextUpdates {
  return {
    chunks: emptyUpdates(),
    chunkVersions: emptyUpdates(),
    snippets: emptyUpdates(),
    visibilityRules: emptyUpdates()
  };
}

/**
 * Updates that will be applied when an action is finished being dispatched.
 * Generic types:
 * T: a (potentially nested) dictionary of keys mapping to data to be added.
 * K: keys that will be used to delete data. Can be compound (e.g., an array of types). That said,
 *    two keys should evaluate to equal with a call to '_.isEqual'.
 */
export interface Updates<T extends {}, K> {
  add: T;
  update: T;
  delete: K[];
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
