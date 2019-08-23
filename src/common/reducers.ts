import { ById, SimpleStore } from "./types";

export function insert<K extends string, T>(
  state: SimpleStore<K, T>,
  id: K,
  index: number,
  item: T
): SimpleStore<K, T> {
  return {
    ...state,
    all: insertInAll(state.all, index, id),
    byId: insertInById(state.byId, id, item)
  };
}

function insertInById<K extends string, T>(state: ById<T>, id: K, item: T): ById<T> {
  return {
    ...state,
    [id]: item
  };
}

function insertInAll<K>(state: K[], index: number, id: K): K[] {
  return state
    .slice(0, index)
    .concat(id)
    .concat(state.slice(index, state.length));
}

/**
 * Move ID to a new position in ID list. Does nothing if 'id' is not in state.
 */
export function move<K extends string, T>(state: SimpleStore<K, T>, id: K, to: number) {
  return {
    ...state,
    all: moveInAll(state.all, id, to)
  };
}

function moveInAll<K>(state: K[], id: K, to: number): K[] {
  const from = state.indexOf(id);
  if (from === -1) {
    return state;
  }
  const spliced = [...state];
  spliced.splice(from, 1);
  return spliced
    .slice(0, to)
    .concat(id)
    .concat(spliced.slice(to, state.length));
}

export function simpleStoreInitialState() {
  return {
    all: [],
    byId: {}
  };
}
