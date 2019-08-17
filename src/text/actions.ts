import uuidv4 from "uuid/v4";
import * as names from "./action-names";
import { InitialChunk, Path } from "./chunks/types";
import { CreateSnippetAction, EditAction, Range, Selection, SetSelectionsAction } from "./types";

/**
 * TODO(andrewhead): reducer needs to make sure that chunks aren't included twice.
 * In the future, should make them visible, but just shown a second time.
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

export function setSelections(...selections: Selection[]): SetSelectionsAction {
  return {
    selections,
    type: names.SET_SELECTIONS
  };
}

/**
 * This action is defined for text and not just a chunk because it affects more than just a chunk's
 * data. For example, if anedit leads to two chunks being merged, then the snippet containing those
 * chunks must be merged.
 */
export function edit(path: Path, range: Range, newText: string): EditAction {
  return {
    edit: { path, range, newText },
    type: names.EDIT
  };
}
