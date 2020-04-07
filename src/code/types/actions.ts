import { AnyAction } from "redux";
import { CellId } from "../../cells/types/cell";
import { SnippetId } from "../types";
import * as names from "./action-names";
import { ChunkId, ChunkVersionId, InitialChunk, Path } from "./chunk";
import { Edit, MergeStrategy, Selection } from "./common";

export interface UploadFileContentsAction {
  type: typeof names.UPLOAD_FILE_CONTENTS;
  path: Path;
  contents: string;
  chunkId: ChunkId;
  chunkVersionId: ChunkVersionId;
}

export interface InsertSnippetAction {
  type: typeof names.INSERT_SNIPPET;
  chunks: InitialChunk[];
  snippetId: SnippetId;
  cellId: CellId;
  index: number;
}

export interface SpliceSnippetAction {
  type: typeof names.SPLICE_SNIPPET;
  snippetId: SnippetId;
  chunks: InitialChunk[];
}

export interface ForkAction {
  type: typeof names.FORK;
  chunkVersionId: ChunkVersionId;
  forkId: ChunkVersionId;
}

export interface PickChunkVersionAction {
  type: typeof names.PICK_CHUNK_VERSION;
  snippetId: SnippetId;
  chunkId: ChunkId;
  chunkVersionId: ChunkVersionId;
}

export interface MergeAction {
  type: typeof names.MERGE;
  strategy: MergeStrategy;
  snippetId: SnippetId;
  chunkVersionId: ChunkVersionId;
  into: ChunkVersionId;
  /**
   * Whether to replace the merged chunk version with the previous version, or to just delete
   * it from the snippet.
   */
  replaceMergedVersion: boolean;
}

export interface EditAction {
  type: typeof names.EDIT;
  edit: Edit;
}

export interface SetSelectionsAction {
  type: typeof names.SET_SELECTIONS;
  selections: Selection[];
}

export type CodeActionTypes =
  | UploadFileContentsAction
  | InsertSnippetAction
  | ForkAction
  | PickChunkVersionAction
  | MergeAction
  | EditAction
  | SetSelectionsAction
  | SpliceSnippetAction;

export function isCodeAction(action: AnyAction): action is CodeActionTypes {
  return Object.keys(names).indexOf(action.type) !== -1;
}
