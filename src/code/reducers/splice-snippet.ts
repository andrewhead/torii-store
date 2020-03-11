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
    // 2. check for duplicates/if chunks are already in snippet
    // 3. splice chunk in a specific position in the snippet
    // 4. update state with spliced chunks of code 

    // don't need to focus on chunk versioning right now

    return {
        ...state, 

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