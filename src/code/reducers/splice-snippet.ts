import _ from "lodash";
import { ContentType, Cell } from "../../cells/types";
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
import { InitialChunk, Snippets } from '../types';
import { ById, SimpleStore } from '../../common/types';

export function spliceSnippet(state: Undoable, action: SpliceSnippetAction) {

    const { chunks: initialChunks, snippetId } = action;
    let updates = emptyCodeUpdates();

    const { cleanedInitialChunks, 
        updates: removeDuplicatesUpdates
    } = removeDuplicatesFromInitialChunks(state, action);
    
    updates = mergeCodeUpdates(updates, removeDuplicatesUpdates);
    updates = mergeCodeUpdates(updates, addChunks(cleanedInitialChunks));

    let newChunkIds: ChunkVersionId[] = Object.keys(updates.chunkVersions.add);

    updates = mergeCodeUpdates(updates, removeDuplicatesFromExistingChunks(state, action, updates))
    updates = mergeCodeUpdates(updates, spliceChunks(state.snippets, snippetId, newChunkIds));

    return {
        ...state,
        chunks: update(state.chunks, updates.chunks),
        chunkVersions: update(state.chunkVersions, updates.chunkVersions),
        snippets: update(state.snippets, updates.snippets)
    };
}

function spliceChunks(
    state: Snippets,
    snippetId: string,
    toAdd: ChunkVersionId[]
) {
    const updates = emptyCodeUpdates();
    let snippet = state.byId[snippetId];
        
    let updatedChunks: ChunkVersionId[];
    if (snippet == null) {
        updatedChunks = toAdd;
    } else {
        updatedChunks = snippet.chunkVersionsAdded.concat(toAdd);
    }
    
    updates.snippets.update[snippetId] = {
        ...updates.snippets.update[snippetId],
        chunkVersionsAdded: updatedChunks
    }
    
    return updates;
}

/**
 * Trying something similar in the same function in `create-snippet.ts`
 * @param state 
 * @param action 
 */
function removeDuplicatesFromInitialChunks(state: Undoable, action: SpliceSnippetAction) {
    const { chunks: initialChunks, snippetId } = action;
    const initialChunkLines = splitIntoLines(initialChunks);
    const updates = emptyCodeUpdates();

    let selectedCellIndex = getCellIndex(state);

    let cellIndex = Math.min(selectedCellIndex - 1, state.cells.all.length - 1);
    for (cellIndex; cellIndex >= 0; cellIndex--) {
        const cell = state.cells.byId[state.cells.all[cellIndex]];

        if (cell.type !== ContentType.SNIPPET) {
            continue;
        }

        const snippet = state.snippets.byId[cell.contentId];
        const chunksEditedBeforeNewSnippet = [];

        for (const chunkVersionId of snippet.chunkVersionsAdded) {
            const { chunkId, path, startLine, endLine, version } = getChunkInfo(state, chunkVersionId);
            if (version > 0) {
              chunksEditedBeforeNewSnippet.push(chunkId);
            } else if (version === 0 && initialChunkLines.hasOwnProperty(path)) {
              for (let line = startLine; line <= endLine; line++) {
                if (initialChunkLines[path].hasOwnProperty(line)) {
                  if (chunksEditedBeforeNewSnippet.indexOf(chunkId) === -1) {
                    const adjustedLine = line - startLine;
                    _.merge(updates.visibilityRules.add, {
                      [snippetId]: {
                        [chunkVersionId]: {
                          [adjustedLine]: visibility.VISIBLE
                        }
                      }
                    });
                  }
                  delete initialChunkLines[path][line];
                }
              }
            }
          }
        }
        /*
         * Remove parts of chunks that already show up in multiple versions of an existing chunk. At the
         * moment, we have no way to split these chunks without user input.
         */
        for (let cellIndex = 0; cellIndex < state.cells.all.length; cellIndex++) {
          const cell = state.cells.byId[state.cells.all[cellIndex]];
          if (cell.type !== ContentType.SNIPPET) {
            continue;
          }
          const snippet = state.snippets.byId[cell.contentId];
          for (const chunkVersionId of snippet.chunkVersionsAdded) {
            const { path, startLine, endLine, ofVersions } = getChunkInfo(state, chunkVersionId);
            if (initialChunkLines.hasOwnProperty(path) && ofVersions > 1) {
              for (let line = startLine; line <= endLine; line++) {
                if (initialChunkLines[path].hasOwnProperty(line)) {
                  delete initialChunkLines[path][line];
                }
              }
            }
          }
        }
        return {
          cleanedInitialChunks: mergeIntoInitialChunks(initialChunkLines),
          updates
        };
    }

function getCellIndex(state: Undoable) { //, action: SpliceSnippetAction) {
    if (state.selectedCell === undefined) {
        return 0;
    } else {
        return state.cells.all.indexOf(state.selectedCell);
    }
}

/**
 * Assumes that any chunk versions in 'chunkVersion.add' have already had duplicate lines removed
 * from them (i.e. with a method like 'removeDuplicatesFromInitialChunks').
 */
function removeDuplicatesFromExistingChunks(
    state: Undoable,
    action: SpliceSnippetAction,
    updates: CodeUpdates
  ): CodeUpdates {
    let chunkCleanupUpdates = emptyCodeUpdates();
    const newChunkLines: ChunkLine[] = [];
    for (let chunkVersionId of Object.keys(updates.chunkVersions.add)) {
      let chunkVersion = updates.chunkVersions.add[chunkVersionId];
      let chunkId = chunkVersion.chunk;
      let chunk = updates.chunks.add[chunkVersion.chunk];
      const lines = textUtils.split(chunkVersion.text);
      for (let offset = 0; offset < lines.length; offset++) {
        const location = {
          ...chunk.location,
          line: chunk.location.line + offset
        };
        newChunkLines.push({ location, chunkId, chunkVersionId, snippetId: action.snippetId });
      }
    }
    const existingChunkLines: ChunkLine[] = [];
    for (let cellIndex = getCellIndex(state); cellIndex < state.cells.all.length; cellIndex++) {
      const cell = state.cells.byId[state.cells.all[cellIndex]];
      if (cell.type !== ContentType.SNIPPET) {
        continue;
      }
      const snippetId = cell.contentId;
      const snippet = state.snippets.byId[snippetId];
      for (const chunkVersionId of snippet.chunkVersionsAdded) {
        const { chunkId, path, startLine, endLine, version } = getChunkInfo(state, chunkVersionId);
        if (version === 0) {
          for (let line = startLine; line <= endLine; line++) {
            const location = { path, line };
            existingChunkLines.push({ location, chunkId, chunkVersionId, snippetId });
          }
        }
      }
    }
    existingChunkLines.push(...getLinesForChunksNotInSnippets(state));
    const repeatedLines: RepeatedLine[] = [];
    for (const existingLine of existingChunkLines) {
      for (const newLine of newChunkLines) {
        if (_.isEqual(existingLine.location, newLine.location)) {
          repeatedLines.push({
            first: newLine,
            second: existingLine
          });
        }
      }
    }
    const lineRemovals: LineRemovals = repeatedLines.reduce((groups, repeatedLine) => {
      const repetitionChunkId = repeatedLine.second.chunkId;
      const line = repeatedLine.second.location.line;
      return {
        ...groups,
        [repetitionChunkId]: (groups[repetitionChunkId] || []).concat(line)
      };
    }, {});
    for (const chunkId of Object.keys(lineRemovals)) {
      const updates = removeLines(state, chunkId, lineRemovals[chunkId]);
      chunkCleanupUpdates = mergeCodeUpdates(chunkCleanupUpdates, updates);
    }
    repeatedLines.forEach(repeatedLine => {
      const repetitionSnippetId = repeatedLine.second.snippetId;
      const initialChunkId = repeatedLine.first.chunkId;
      const initialChunkVersionId = repeatedLine.first.chunkVersionId;
      const initialChunk = updates.chunks.add[initialChunkId];
      const lineOffset = repeatedLine.first.location.line - initialChunk.location.line;
      if (repetitionSnippetId !== undefined) {
        _.merge(chunkCleanupUpdates.visibilityRules.add, {
          [repetitionSnippetId]: {
            [initialChunkVersionId]: {
              [lineOffset]: visibility.VISIBLE
            }
          }
        });
      }
    });
    return chunkCleanupUpdates;
  }

  /**
 * Some chunks will not have been included in snippets yet. Get chunk lines from those chunks.
 */
function getLinesForChunksNotInSnippets(state: Undoable): ChunkLine[] {
    const allChunkVersionIds = state.chunkVersions.all;
    let unaddedChunkVersionIds = allChunkVersionIds;
    for (const snippetId of state.snippets.all) {
      const snippet = state.snippets.byId[snippetId];
      for (const chunkVersionId of snippet.chunkVersionsAdded) {
        const index = unaddedChunkVersionIds.indexOf(chunkVersionId);
        if (index !== -1) {
          unaddedChunkVersionIds = unaddedChunkVersionIds
            .slice(0, index)
            .concat(unaddedChunkVersionIds.slice(index + 1, unaddedChunkVersionIds.length));
        }
      }
    }
  
    const chunkLines = [];
    for (const unaddedChunkVersionId of unaddedChunkVersionIds) {
      const { chunkId, startLine, endLine, path, version } = getChunkInfo(
        state,
        unaddedChunkVersionId
      );
      if (version === 0) {
        for (let line = startLine; line <= endLine; line++) {
          const location = { line, path };
          chunkLines.push({ chunkId, chunkVersionId: unaddedChunkVersionId, location });
        }
      }
    }
    return chunkLines;
  }

  interface LineRemovals {
    /**
     * Number array is a list of lines to remove from the chunk to split the code. Line numbers are
     * absolute (relative to the start of the file, not the start of the chunk.)
     */
    [chunkId: string]: number[];
  }
  
  interface ChunkLine {
    snippetId?: SnippetId;
    chunkId: ChunkId;
    chunkVersionId: ChunkVersionId;
    location: Location;
  }
  
  /**
   * A line that's included in two separate chunk versions.
   */
  interface RepeatedLine {
    first: ChunkLine;
    second: ChunkLine;
  }
  