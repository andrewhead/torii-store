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
