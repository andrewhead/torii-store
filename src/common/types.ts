/**
 * A simple relational store.
 */
export interface SimpleStore<K extends string, T> {
  /**
   * A list of (string-based) IDs for all objects in the store.
   */
  all: K[];
  /**
   * A lookup table of objects, keyed by ID.
   */
  byId: ById<T>;
}

export interface ById<T> {
  [id: string]: T;
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
