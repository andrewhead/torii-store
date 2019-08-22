import uuidv4 from "uuid/v4";
import * as names from "./action-names";
import { InitialChunk, Path } from "./chunks/types";
import {
  CreateSnippetAction,
  EditAction,
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
 */
export function createSnippet(index: number, ...chunks: InitialChunk[]): CreateSnippetAction {
  const id = uuidv4();
  return {
    chunks: chunks || [],
    id,
    index,
    type: names.CREATE_SNIPPET
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
