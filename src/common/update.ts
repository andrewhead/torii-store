import _ from "lodash";
import { ById, SimpleStore, Updates } from "./types";

export function mergeUpdates<T, K>(...updatesItems: Updates<T, K>[]) {
  return {
    add: _.merge({}, ...updatesItems.map(u => u.add)),
    update: _.merge({}, ...updatesItems.map(u => u.update)),
    delete: updatesItems.reduce((deleteList, item) => {
      return _.unionWith(deleteList, item.delete, _.isEqual);
    }, [])
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

export function emptyUpdates<T, K>(): Updates<T, K> {
  return {
    add: {} as T,
    update: {} as T,
    delete: [] as K[]
  };
}
