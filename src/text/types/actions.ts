import { AnyAction } from "redux";
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
