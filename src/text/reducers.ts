import _ from "lodash";
import { AnyAction } from "redux";
import uuidv4 from "uuid/v4";
import * as names from "./action-names";
import { ChunkId, ChunkVersionId, InitialChunk, Location } from "./chunks/types";
import {
  insertSnippet,
  updateVisibilityRules,
  visibilityRulesInitialState
} from "./snippets/helpers";
import { SnippetId, visibility } from "./snippets/types";
import {
  ById,
  CreateSnippetAction,
  isTextAction,
  SimpleStore,
  Text,
  TextUpdates,
  Updates
} from "./types";

/**
 * Semantics that are not yet supported (but that should be).
 *
 * High priority
 * =============
 * - Chunks should get added on "add-chunk", removed and split on remove.
 *   - Merge adjacent cells
 * - On an edit event
 *   - Merge two cells that have become adjacent.
 *
 * Lower priority
 * ==============
 * - Let people split chunks that have later versions of them. Perhaps by better tracking of edits
 *   that have been applied and inference of how later versions should be split. Perhaps by
 *   asking for user input to split the later blocks. At the very least, provide an informative
 *   error message telling them to start again with fresh blocks, or delete the later changes...
 */

/**
 * TODO(andrewhead): This and other reducer functions takes AnyAction as the second argument and
 * checks its type to make sure it is a text action. This is because of a limitation of the
 * undoable library where currently, the type of action is constrained to be "AnyAction". When that
 * bug gets fixed, all of these reducers should be refactored to take a more precise type as the
 * second argument. Follow the issue here: https://github.com/omnidan/redux-undo/issues/229
 */
export function textReducer(state: Text = initialState, action: AnyAction) {
  if (isTextAction(action)) {
    switch (action.type) {
      case names.CREATE_SNIPPET:
        return createSnippet(state, action);
      default:
        return state;
    }
  }
  return state;
}

export const initialState = {
  snippets: simpleStoreInitialState(),
  chunks: simpleStoreInitialState(),
  chunkVersions: simpleStoreInitialState(),
  visibilityRules: visibilityRulesInitialState
};

function updateById<K, T>(state: ById<T>, updates: Updates<ById<T>, K>) {
  const updatedState = {
    ...state,
    ...updates.add,
    ...updates.update
  };
  for (const id of updates.delete) {
    if (typeof id === "string") {
      delete updatedState[id];
    }
  }
  return updatedState;
}

function updateAllList<K extends string>(state: K[], updates: Updates<any, K>): K[] {
  const updatedState = [...state];
  const keys = Object.keys(updates.add).concat(Object.keys(updates.update)) as K[];
  for (const key of keys) {
    if (updatedState.indexOf(key) === -1) {
      updatedState.push(key);
    }
  }
  for (const id of updates.delete) {
    const index = updatedState.indexOf(id);
    if (index !== -1) {
      updatedState.splice(index, 1);
    }
  }
  return updatedState;
}

function update<K extends string, T>(
  state: SimpleStore<K, T>,
  updates: Updates<ById<T>, K>
): SimpleStore<K, T> {
  return {
    all: updateAllList(state.all, updates),
    byId: updateById(state.byId, updates)
  };
}

function createSnippet(state: Text, action: CreateSnippetAction) {
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

function mergeUpdates<T, K>(...updatesItems: Updates<T, K>[]) {
  return {
    add: _.merge({}, ...updatesItems.map(u => u.add)),
    update: _.merge({}, ...updatesItems.map(u => u.update)),
    delete: updatesItems.reduce((deleteList, item) => {
      return _.unionWith(deleteList, item.delete, _.isEqual);
    }, [])
  };
}

function mergeTextUpdates(...textUpdatesItems: TextUpdates[]) {
  return {
    chunks: mergeUpdates(...textUpdatesItems.map(t => t.chunks)),
    chunkVersions: mergeUpdates(...textUpdatesItems.map(t => t.chunkVersions)),
    snippets: mergeUpdates(...textUpdatesItems.map(t => t.snippets)),
    visibilityRules: mergeUpdates(...textUpdatesItems.map(t => t.visibilityRules))
  };
}

function toLines(text: string) {
  const NEWLINE = /\n/;
  return text.split(NEWLINE);
}

function splitIntoLines(initialChunks: InitialChunk[]): ChunkLines {
  const chunkLines: ChunkLines = {};
  for (const initialChunk of initialChunks) {
    const lines = toLines(initialChunk.text);
    const { path, line: lineNumber } = initialChunk.location;
    for (let lineOffset = 0; lineOffset < lines.length; lineOffset++) {
      _.merge(chunkLines, {
        [path]: {
          [lineNumber + lineOffset]: lines[lineOffset]
        }
      });
    }
  }
  return chunkLines;
}

function mergeIntoInitialChunks(chunkLines: ChunkLines): InitialChunk[] {
  const initialChunks = [];
  for (const path of Object.keys(chunkLines)) {
    let lastLine: number;
    let initialChunk: InitialChunk;
    for (const line of Object.keys(chunkLines[path]).map(l => Number(l))) {
      if (lastLine === undefined || line > lastLine - 1) {
        if (initialChunk !== undefined) {
          initialChunks.push(initialChunk);
        }
        initialChunk = {
          location: { path, line: Number(line) },
          text: chunkLines[path][line]
        };
      } else if (line === lastLine - 1) {
        initialChunk.text += "\n" + chunkLines[path][line];
      }
      lastLine = line;
    }
    if (initialChunk !== undefined) {
      initialChunks.push(initialChunk);
    }
  }
  return initialChunks;
}

function getSnippet(state: Text, index: number) {
  return state.snippets.byId[state.snippets.all[index]];
}

function getChunkInfo(state: Text, chunkVersionId: ChunkVersionId) {
  const chunkVersion = state.chunkVersions.byId[chunkVersionId];
  const chunk = state.chunks.byId[chunkVersion.chunk];
  return {
    chunkId: chunkVersion.chunk,
    version: chunk.versions.indexOf(chunkVersionId),
    ofVersions: chunk.versions.length,
    path: chunk.location.path,
    startLine: chunk.location.line,
    endLine: chunk.location.line + toLines(chunkVersion.text).length - 1,
    text: chunkVersion.text
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

function addChunks(initialChunks: InitialChunk[]): TextUpdates {
  const updates = emptyTextUpdates();
  for (const chunkData of initialChunks) {
    const { text, location } = chunkData;
    const chunkId = uuidv4();
    const chunkVersionId = uuidv4();
    updates.chunks.add[chunkId] = {
      location,
      versions: [chunkVersionId]
    };
    updates.chunkVersions.add[chunkVersionId] = {
      text,
      chunk: chunkId
    };
  }
  return updates;
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
    const lines = toLines(chunkVersion.text);
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

/**
 * Assumes that this is only ever called on chunks with only one version.
 */
function removeLines(state: Text, chunkId: ChunkId, lines: number[]): TextUpdates {
  let updates = emptyTextUpdates();
  const chunk = state.chunks.byId[chunkId];
  const chunkVersionId = chunk.versions[0];
  const chunkVersion = state.chunkVersions.byId[chunkVersionId];
  const chunkLines = splitIntoLines([{ location: chunk.location, text: chunkVersion.text }]);
  for (const line of lines) {
    delete chunkLines[chunk.location.path][line];
  }
  const initialChunks = mergeIntoInitialChunks(chunkLines);
  const additions = addChunks(initialChunks);
  updates = mergeTextUpdates(updates, additions);
  for (const snippetId of state.snippets.all) {
    const snippet = state.snippets.byId[snippetId];
    const chunkVersionIndex = snippet.chunkVersionsAdded.indexOf(chunkVersionId);
    const chunkVersionsAdded = [...snippet.chunkVersionsAdded];
    if (chunkVersionIndex !== -1) {
      chunkVersionsAdded.splice(chunkVersionIndex, 1);
    }
    chunkVersionsAdded.push(...Object.keys(additions.chunkVersions.add));
    updates.snippets.update[snippetId] = {
      chunkVersionsAdded: chunkVersionsAdded
    };
  }
  updates.chunks.delete.push(chunkId);
  updates.chunkVersions.delete.push(chunkVersionId);
  return updates;
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

interface ChunkLines {
  [pathIdentifier: string]: {
    [line: number]: string;
  };
}

function simpleStoreInitialState() {
  return {
    all: [],
    byId: {}
  };
}

function emptyUpdates<T, K>(): Updates<T, K> {
  return {
    add: {} as T,
    update: {} as T,
    delete: [] as K[]
  };
}

function emptyTextUpdates(): TextUpdates {
  return {
    chunks: emptyUpdates(),
    chunkVersions: emptyUpdates(),
    snippets: emptyUpdates(),
    visibilityRules: emptyUpdates()
  };
}
