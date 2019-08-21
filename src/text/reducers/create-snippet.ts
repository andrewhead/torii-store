import _ from "lodash";
import * as textUtils from "../../util/text-utils";
import { ChunkId, ChunkVersionId, Location } from "../chunks/types";
import { insertSnippet } from "../snippets/helpers";
import { SnippetId, visibility } from "../snippets/types";
import { CreateSnippetAction, Text } from "../types";
import {
  addChunks,
  getChunkInfo,
  getSnippet,
  mergeIntoInitialChunks,
  removeLines,
  splitIntoLines
} from "./common";
import {
  emptyTextUpdates,
  mergeTextUpdates,
  TextUpdates,
  update,
  updateVisibilityRules
} from "./updates";

export function createSnippet(state: Text, action: CreateSnippetAction) {
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
  state = {
    ...state,
    chunks: update(state.chunks, updates.chunks),
    chunkVersions: update(state.chunkVersions, updates.chunkVersions),
    snippets: update(state.snippets, updates.snippets),
    visibilityRules: updateVisibilityRules(state.visibilityRules, updates.visibilityRules)
  };
  return {
    ...state,
    snippets: insertSnippet(state.snippets, action.id, action.index, newSnippet)
  };
}

function removeDuplicatesFromInitialChunks(state: Text, action: CreateSnippetAction) {
  const { chunks: initialChunks, id: snippetId, index: newSnippetIndex } = action;
  const initialChunkLines = splitIntoLines(initialChunks);
  const updates = emptyTextUpdates();
  /*
   * Remove parts of chunks that showed up in earliers steps, though show them in the snippet.
   */
  for (
    let snippetIndex = Math.min(newSnippetIndex - 1, state.snippets.all.length - 1);
    snippetIndex >= 0;
    snippetIndex--
  ) {
    const snippet = getSnippet(state, snippetIndex);
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
  for (let snippetIndex = 0; snippetIndex < state.snippets.all.length; snippetIndex++) {
    const snippet = getSnippet(state, snippetIndex);
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
  state: Text,
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
      newChunkLines.push({ location, chunkId, chunkVersionId, snippetId: action.id });
    }
  }
  const existingChunkLines: ChunkLine[] = [];
  for (let snippetIndex = action.index; snippetIndex < state.snippets.all.length; snippetIndex++) {
    const snippetId = state.snippets.all[snippetIndex];
    const snippet = getSnippet(state, snippetIndex);
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
    _.merge(chunkCleanupUpdates.visibilityRules.add, {
      [repetitionSnippetId]: {
        [initialChunkVersionId]: {
          [lineOffset]: visibility.VISIBLE
        }
      }
    });
  });
  return chunkCleanupUpdates;
}

interface LineRemovals {
  /**
   * Number array is a list of lines to remove from the chunk to split the code. Line numbers are
   * absolute (relative to the start of the file, not the start of the chunk.)
   */
  [chunkId: string]: number[];
}

interface ChunkLine {
  snippetId: SnippetId;
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
