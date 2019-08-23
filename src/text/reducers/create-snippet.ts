import _ from "lodash";
import { ContentType } from "../../cells/types";
import { insert } from "../../common/reducers";
import { update } from "../../common/update";
import { Undoable } from "../../types";
import * as textUtils from "../../util/text-utils";
import {
  ChunkId,
  ChunkVersionId,
  CreateSnippetAction,
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
import { emptyTextUpdates, mergeTextUpdates, TextUpdates, updateVisibilityRules } from "./update";

export function createSnippet(state: Undoable, action: CreateSnippetAction) {
  let updates = emptyTextUpdates();
  const {
    cleanedInitialChunks,
    updates: removeDuplicatesUpdates
  } = removeDuplicatesFromInitialChunks(state, action);
  updates = mergeTextUpdates(updates, removeDuplicatesUpdates);
  updates = mergeTextUpdates(updates, addChunks(cleanedInitialChunks));
  /*
   * Separate new snippet from the rest of the updates: we have to add it at a specific position,
   * which the boilerplate update code doesn't handle.
   */
  const newSnippet = {
    chunkVersionsAdded: Object.keys(updates.chunkVersions.add)
  };
  updates = mergeTextUpdates(updates, removeDuplicatesFromExistingChunks(state, action, updates));
  updates = mergeTextUpdates(updates, fixVisibilityRules(state, updates));
  state = {
    ...state,
    chunks: update(state.chunks, updates.chunks),
    chunkVersions: update(state.chunkVersions, updates.chunkVersions),
    snippets: update(state.snippets, updates.snippets),
    visibilityRules: updateVisibilityRules(state.visibilityRules, updates.visibilityRules)
  };
  return {
    ...state,
    snippets: insert(state.snippets, action.snippetId, action.index, newSnippet)
  };
}

function removeDuplicatesFromInitialChunks(state: Undoable, action: CreateSnippetAction) {
  const { chunks: initialChunks, snippetId, index: newCellIndex } = action;
  const initialChunkLines = splitIntoLines(initialChunks);
  const updates = emptyTextUpdates();
  /*
   * Remove parts of chunks that showed up in earliers steps, though show them in the snippet.
   */
  for (
    let cellIndex = Math.min(newCellIndex - 1, state.cells.all.length - 1);
    cellIndex >= 0;
    cellIndex--
  ) {
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
              _.merge(updates.visibilityRules.add, {
                [snippetId]: {
                  [chunkVersionId]: {
                    [line]: visibility.VISIBLE
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

/**
 * Assumes that any chunk versions in 'chunkVersion.add' have already had duplicate lines removed
 * from them (i.e. with a method like 'removeDuplicatesFromInitialChunks').
 */
function removeDuplicatesFromExistingChunks(
  state: Undoable,
  action: CreateSnippetAction,
  updates: TextUpdates
): TextUpdates {
  let chunkCleanupUpdates = emptyTextUpdates();
  const newChunkLines: ChunkLine[] = [];
  for (let chunkVersionId of Object.keys(updates.chunkVersions.add)) {
    let chunkVersion = updates.chunkVersions.add[chunkVersionId];
    let chunkId = chunkVersion.chunk;
    let chunk = updates.chunks.add[chunkVersion.chunk];
    const lines = textUtils.toLines(chunkVersion.text);
    for (let offset = 0; offset < lines.length; offset++) {
      const location = {
        ...chunk.location,
        line: chunk.location.line + offset
      };
      newChunkLines.push({ location, chunkId, chunkVersionId, snippetId: action.snippetId });
    }
  }
  const existingChunkLines: ChunkLine[] = [];
  for (let cellIndex = action.index; cellIndex < state.cells.all.length; cellIndex++) {
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
    chunkCleanupUpdates = mergeTextUpdates(chunkCleanupUpdates, updates);
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
      const index = allChunkVersionIds.indexOf(chunkVersionId);
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

/**
 * Check visibility rules for deleted chunk versions, and transfer ownership to newly-added
 * chunk versions as appropriate. Only replaces a deleted chunk version with version 0 of
 * another chunk (not later versions of the chunk).
 */
function fixVisibilityRules(state: Undoable, updates: TextUpdates): TextUpdates {
  let visibilityFixUpdates = emptyTextUpdates();
  for (const chunkVersionId of updates.chunkVersions.delete) {
    for (const snippetId of Object.keys(state.visibilityRules)) {
      if (state.visibilityRules[snippetId][chunkVersionId] !== undefined) {
        for (const line of Object.keys(state.visibilityRules[snippetId][chunkVersionId])) {
          const lineNumber = Number(line);
          const chunkVersion = state.chunkVersions.byId[chunkVersionId];
          const chunk = state.chunks.byId[chunkVersion.chunk];
          const absoluteLine = lineNumber + chunk.location.line;
          const visibility = state.visibilityRules[snippetId][chunkVersionId][line];
          updates.visibilityRules.delete.push([snippetId, chunkVersionId, lineNumber]);
          for (const addedChunkVersionId of Object.keys(updates.chunkVersions.add)) {
            const addedChunkVersion = updates.chunkVersions.add[addedChunkVersionId];
            const addedChunkVersionChunkId = addedChunkVersion.chunk;
            const addedChunkVersionChunk =
              updates.chunks.update[addedChunkVersionChunkId] ||
              updates.chunks.add[addedChunkVersionChunkId] ||
              state.chunks.byId[addedChunkVersionChunkId];
            if (addedChunkVersionChunk !== undefined) {
              const index = addedChunkVersionChunk.versions.indexOf(addedChunkVersionId);
              if (
                index === 0 &&
                _.isEqual(addedChunkVersionChunk.location.path, chunk.location.path)
              ) {
                const chunkStart = addedChunkVersionChunk.location.line;
                const newChunkEnd =
                  chunkStart + textUtils.toLines(addedChunkVersion.text).length - 1;
                if (absoluteLine >= chunkStart && absoluteLine <= newChunkEnd) {
                  const adjustedLine = absoluteLine - chunkStart;
                  _.merge(visibilityFixUpdates.visibilityRules.add, {
                    [snippetId]: {
                      [addedChunkVersionId]: {
                        [adjustedLine]: visibility
                      }
                    }
                  });
                }
              }
            }
          }
        }
      }
    }
  }
  return mergeTextUpdates(updates, visibilityFixUpdates);
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
