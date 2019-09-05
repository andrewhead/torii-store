import { ById, SimpleStore } from "./types";

export function simpleStoreInitialState() {
  return {
    all: [],
    byId: {}
  };
}

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

export function addIdIfMissing<K>(state: K[], id: K): K[] {
  if (state.indexOf(id) === -1) {
    return state.concat(id);
  }
  return state;
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

export function deleteItem<K extends string, T>(
  state: SimpleStore<K, T>,
  id: K
): SimpleStore<K, T> {
  return {
    ...state,
    all: deleteFromAll(state.all, id),
    byId: deleteFromById(state.byId, id)
  };
}

function deleteFromById<K extends string, T>(state: ById<T>, id: K): ById<T> {
  state = { ...state };
  delete state[id];
  return state;
}

function deleteFromAll<K>(state: K[], id: K): K[] {
  state = [...state];
  const index = state.indexOf(id);
  if (index !== -1) {
    state.splice(index, 1);
  }
  return state;
}
