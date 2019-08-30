import { AnyAction } from "redux";
import { CellId } from "../../cells/types/cell";
import { SnippetId } from "../types";
import * as names from "./action-names";
import { ChunkId, ChunkVersionId, InitialChunk, Path } from "./chunk";
import { Edit, Selection } from "./common";

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
  | EditAction
  | SetSelectionsAction;

export function isCodeAction(action: AnyAction): action is CodeActionTypes {
  return Object.keys(names).indexOf(action.type) !== -1;
}
