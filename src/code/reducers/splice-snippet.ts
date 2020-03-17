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
  splitIntoLines,
  getSnippet
} from "./common";
import { 
    CodeUpdates, 
    emptyCodeUpdates, 
    mergeCodeUpdates, 
    ChunkVersionsUpdates
} from "./update";
import { InitialChunk,  } from '../types';
import { ById, SimpleStore } from '../../common/types';

export function spliceSnippet(state: Undoable, action: SpliceSnippetAction) {
    // implementation steps v2:
    // 1. get snippet from state (done)
    // 2. update chunks and chunkversions in state (done)
    // 3. get chunkID, chunkVersionID from helper functions (see below)
    // 4. use chunkId + chunkVersionId and snippetId to add chunk information 
    //    to snippet in a copy of state

    // things i can ignore for now
    // 1. on chunk versioning right now
    // 2. check for duplicates/if chunks are already in snippet

    const { chunks: initialChunks, snippetId } = action;

    let updates = emptyCodeUpdates();
    let add = addChunks(initialChunks);
    updates = mergeCodeUpdates(updates, add);

    //let addedChunkVersionIds: ChunkVersionId = getInitialChunkVersionId(updates.chunkVersions);

    //console.log(addedChunkVersionIds);

    let newChunkIds: ChunkVersionId[] = Object.keys(updates.chunkVersions.add);
    console.log(newChunkIds);

    updates = mergeCodeUpdates(updates, spliceChunks(state, snippetId, newChunkIds));
    
    state = {
        ...state,
        chunks: update(state.chunks, updates.chunks),
        chunkVersions: update(state.chunkVersions, updates.chunkVersions),
        snippets: update(state.snippets, updates.snippets)
    };

    return {
        ...state
    }
}

function spliceChunks(
    state: Undoable,
    snippetId: string,
    toAdd: ChunkVersionId[]
) {
    const updates = emptyCodeUpdates();
    let snippet = state.snippets.byId[snippetId];
        
    let updatedChunks: ChunkVersionId[];
    if (snippet == null) {
        // if snippet is empty, only add the spliced chunks -- is this an ideal interaction?
        updatedChunks = toAdd;
    } else {
        updatedChunks = snippet.chunkVersionsAdded.concat(toAdd);
    }
    
    updates.snippets.update[snippetId] = {
        chunkVersionsAdded: updatedChunks
    }
    
    return updates;
}

function getInitialChunkVersionId(update: ChunkVersionsUpdates) {
    let { ChunkVersionId } = update.add;
    return ChunkVersionId.chunk;
}


// ######### graveyard code area!! potential for revival, likelihood low #########
function spliceInById<K extends string, T>(state: ById<T>, id: K, item: T) {
    //let  = {...state.byId};
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
