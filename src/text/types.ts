import { AnyAction } from "redux";
import * as names from "./action-names";
import {
  Chunks,
  ChunksUpdates,
  ChunkVersionId,
  ChunkVersions,
  ChunkVersionsUpdates,
  InitialChunk,
  Path
} from "./chunks/types";
import {
  Snippets,
  SnippetsUpdates,
  VisibilityRules,
  VisibilityRulesUpdates
} from "./snippets/types";

export interface Text {
  snippets: Snippets;
  chunks: Chunks;
  chunkVersions: ChunkVersions;
  visibilityRules: VisibilityRules;
  selections: Selection[];
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
  byId: ById<T>;
}

export interface ById<T> {
  [id: string]: T;
}

/**
 * This interface is based on the "TextEdit" interface in VSCode.
 */
export interface Edit {
  path: Path;
  range: Range;
  newText: string;
}

/**
 * Editor-agnostic, path-independent range of characters. 'start' should always be before 'end'.
 * Callers of range should be able to assume start always comes before end.
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Editor-agnostic text selection. Based on VSCode Selection API. It's assumed that all selections
 * will fit neatly within the bounds of chunks.
 */
export interface Selection {
  /**
   * Starting position of the selection: where the user clicked first.
   */
  anchor: Position;
  /**
   * Ending position of the selection: where the user dragged to. Can be before or after anchor.
   */
  active: Position;
  /**
   * Path to the file in which the selection was made.
   */
  path: Path;
  /**
   * Information about where the selection was made. Can be used to determine whether the
   * selection position is absolute or relative, and to what it's relative.
   */
  relativeTo: Source;
}

type Source = ReferenceImplementationSource | ChunkVersionSource;

export enum SourceType {
  REFERENCE_IMPLEMENTATION,
  CHUNK_VERSION
}

/**
 * Line numbers are relative to the start of the reference implementation file.
 */
export interface ReferenceImplementationSource {
  source: SourceType.REFERENCE_IMPLEMENTATION;
}

/**
 * Line numbers are relative to the start of chunk version's text.
 */
export interface ChunkVersionSource {
  source: SourceType.CHUNK_VERSION;
  chunkVersionId: ChunkVersionId;
}

export interface Position {
  /**
   * The first line in a file or a chunk has an index of 1.
   */
  line: number;
  /**
   * The first character in a line has an index of 0.
   */
  character: number;
}

export interface CreateSnippetAction {
  type: typeof names.CREATE_SNIPPET;
  chunks: InitialChunk[];
  id: string;
  index: number;
}

export interface SetSelectionsAction {
  type: typeof names.SET_SELECTIONS;
  selections: Selection[];
}

export interface EditAction {
  type: typeof names.EDIT;
  edit: Edit;
}

export type TextActionTypes = CreateSnippetAction | SetSelectionsAction | EditAction;

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
