import { AnyAction } from "redux";
import { Path, InitialChunk, Chunks, ChunkVersions, ChunksUpdates, ChunkVersionsUpdates } from "./chunks/types";
import * as names from "./action-names";
import { Snippets, VisibilityRules, VisibilityRulesUpdates, SnippetsUpdates } from "./snippets/types";

export interface Text {
  snippets: Snippets;
  chunks: Chunks;
  chunkVersions: ChunkVersions;
  visibilityRules: VisibilityRules;
}

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
  byId: ById<T>
}

export interface ById<T> {
  [ id: string ]: T;
}

/**
 * This interface is based on the "TextEdit" interface in VSCode.
 */
export interface Edit {
  path: Path;
  range: Range;
  newText: string;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Position {
  /**
   * First line's index is 0.
   */
  line: number;
  /**
   * First character's index is 0.
   */
  character: number;
}

export interface CreateSnippetAction {
  type: typeof names.CREATE_SNIPPET;
  chunks: InitialChunk[];
  id: string;
  index: number;
}

export interface EditAction {
  type: typeof names.EDIT;
  edit: Edit;
}

export type TextActionTypes = CreateSnippetAction | EditAction;

export function isTextAction(action: AnyAction): action is TextActionTypes {
  return (action as TextActionTypes).type !== undefined;
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