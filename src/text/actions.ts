import * as names from "./action-names";
import { Path, InitialChunk } from "./chunks/types";
import { CreateSnippetAction, EditAction, Range } from "./types";
import uuidv4 from "uuid/v4";

/**
 * TODO(andrewhead): reducer needs to make sure that chunks aren't included twice.
 * In the future, should make them visible, but just shown a second time.
 */
export function createSnippet(index: number, chunks?: InitialChunk[]): CreateSnippetAction {
  const id = uuidv4();
  return {
    chunks: chunks || [],
    id,
    index,
    type: names.CREATE_SNIPPET
  };
}

/**
 * This is a global action because it affects more than just a chunk's data. If an edit leads
 * to two chunks being merged, then the snippet containing those chunks must be merged.
 */
export function edit(path: Path, range: Range, newText: string): EditAction {
  return {
    edit: { path, range, newText },
    type: names.EDIT
  };
}

/*
export function addChunks(snippetIndex: number, chunks: InitialChunk[]): AddChunkAction {
  return {
    chunkVersionId: chunkVersionId,
    snippetId: snippetId,
    type: names.ADD_CHUNKS
  };
}
*/
