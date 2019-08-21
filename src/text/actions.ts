import uuidv4 from "uuid/v4";
import * as names from "./action-names";
import { InitialChunk } from "./chunks/types";
import {
  CreateSnippetAction,
  EditAction,
  Selection,
  SetSelectionsAction,
  SourcedRange
} from "./types";

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
