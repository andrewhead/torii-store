import _ from "lodash";
import { ContentType } from "../../cells/types";
import { insert } from "../../common/reducers";
import { update } from "../../common/update";
import { Undoable } from "../../state/types";
import * as textUtils from "../../util/text-utils";
import {
  ChunkId,
  ChunkVersionId,
  SpliceSnippetAction,
  InsertSnippetAction,
  Location,
  SnippetId,
  visibility
} from "../types";
import {
  addChunks,
  getChunkInfo,
  mergeIntoInitialChunks,
  removeLines,
  splitIntoLines
} from "./common";
import { 
    CodeUpdates, 
    emptyCodeUpdates, 
    mergeCodeUpdates, 
    updateVisibilityRules 
} from "./update";


export function spliceSnippet(state: Undoable, action: SpliceSnippetAction) {
    // implementation steps
    // 1. get snippet from state
    // 2. splice chunk in a specific position in the snippet
    // 3. update state with spliced chunks of code 
            // - need to write a `splice` function to call in return state's snippet field ?

    // things i can ignore for now
    // 1. on chunk versioning right now
    // 2. check for duplicates/if chunks are already in snippet


    // naive implementation 
    const { chunks: initialChunks, snippetId } = action;
    //const initialChunkLines = splitIntoLines(initialChunks);
    //const snippet = state.snippets.byId[snippetId];
    let updates = emptyCodeUpdates();
    updates = mergeCodeUpdates(updates, addChunks(initialChunks));

    state = {
        ...state,
        chunks: update(state.chunks, updates.chunks),
        chunkVersions: update(state.chunkVersions, updates.chunkVersions),
        snippets: update(state.snippets, updates.snippets),
    }

    return {
        ...state,
        snippet: null //TODO: replace null w/ splice(...) (?)
    }
}

/**
 * Trying something similar in the same function in `create-snippet.ts`
 * @param state 
 * @param action 
 */
function removeDuplicatesFromInitialChunks(state: Undoable, action: SpliceSnippetAction) {
    const { chunks: initialChunks, snippetId } = action;
    const initialChunkLines = splitIntoLines(initialChunks);

}