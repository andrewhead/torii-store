import { AnyAction } from "redux";
import * as names from "./action-names";
import { ChunkId, Chunks, ChunkVersionId, ChunkVersions, InitialChunk, Path } from "./chunks/types";
import { Snippets, VisibilityRules } from "./snippets/types";

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
  range: SourcedRange;
  newText: string;
}

/**
 * A range with details about the source (e.g., file, chunk) the range is from.
 */
export interface SourcedRange extends Range, RangeSource {}

/**
 * Range of characters in a text file, independent of any one editor's API.
 * 'start' should always be before 'end'. Users of range data types should be
 * able to assume start always comes before end.
 */
export interface Range {
  /**
   * Position of the first character in the range.
   */
  start: Position;
  /**
   * Position of 1 character beyond the last character in the range.
   */
  end: Position;
}

/**
 * Text selection, independent of any specific editor API. Based loosely on VSCode Selection API.
 * It's assumed that all selections will fit neatly within the bounds of chunks.
 */
export interface Selection extends RangeSource {
  /**
   * Starting position of the selection: where the user clicked first.
   */
  anchor: Position;
  /**
   * Ending position of the selection: where the user dragged to. Can be before or after anchor.
   */
  active: Position;
}

/**
 * Taken together, this information should be able to uniquely identify either a file, or a chunk
 * version, to which this range refers.
 */
interface RangeSource {
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

export interface UploadFileContentsAction {
  type: typeof names.UPLOAD_FILE_CONTENTS;
  path: Path;
  contents: string;
  chunkId: ChunkId;
  chunkVersionId: ChunkVersionId;
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

export interface SetSelectionsAction {
  type: typeof names.SET_SELECTIONS;
  selections: Selection[];
}

export type TextActionTypes =
  | UploadFileContentsAction
  | CreateSnippetAction
  | EditAction
  | SetSelectionsAction;

export function isTextAction(action: AnyAction): action is TextActionTypes {
  return (action as TextActionTypes).type !== undefined;
}
