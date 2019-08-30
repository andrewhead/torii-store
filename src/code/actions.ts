import uuidv4 from "uuid/v4";
import { State } from "..";
import { insertIndex } from "../common/actions";
import { CellInsertLocation } from "../common/types";
import {
  codeActionNames as names,
  EditAction,
  InitialChunk,
  InsertSnippetAction,
  Path,
  Selection,
  SetSelectionsAction,
  SourcedRange,
  UploadFileContentsAction
} from "./types";

/**
 * Upload the contents for a file to the store. You must do this before creating any snippets
 * from the file. If you don't, it will cause edits to have unpredictable behavior. Before
 * calling this function, you should make sure the file contents haven't already been
 * uploaded (look in 'state-utils' for a utility to do this). If you upload the file contents
 * twice, you will see unpredictable behavior.
 */
export function uploadFileContents(path: Path, contents: string): UploadFileContentsAction {
  const chunkId = uuidv4();
  const chunkVersionId = uuidv4();
  return {
    chunkId,
    chunkVersionId,
    contents,
    path,
    type: names.UPLOAD_FILE_CONTENTS
  };
}

/**
 * Before you create a snippet, you must upload the contents of the file using 'uploadFileContents'.
 * 'index' is the index where the cell containing the snippet will be inserted in the tutorial.
 */
export function insertSnippet(state: State, ...chunks: InitialChunk[]): InsertSnippetAction;
export function insertSnippet(index: number, ...chunks: InitialChunk[]): InsertSnippetAction;
export function insertSnippet(
  location: CellInsertLocation,
  ...chunks: InitialChunk[]
): InsertSnippetAction {
  const snippetId = uuidv4();
  const cellId = uuidv4();
  return {
    cellId,
    chunks: chunks || [],
    snippetId,
    index: insertIndex(location),
    type: names.INSERT_SNIPPET
  };
}

/**
 * This action is defined for the 'text' slice of a state and not just a single chunk because it
 * affects more than just a chunk's data. For example, if an edit leads to two chunks being merged,
 * then the snippet containing those chunks must be merged.
 */
export function edit(range: SourcedRange, newText: string): EditAction {
  return {
    edit: { range, newText },
    type: names.EDIT
  };
}

export function setSelections(...selections: Selection[]): SetSelectionsAction {
  return {
    selections,
    type: names.SET_SELECTIONS
  };
}
