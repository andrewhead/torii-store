import _ from "lodash";
import { DeepPartial } from "redux";
import uuidv4 from "uuid/v4";
import { State } from "..";
import { ContentType } from "../cells/types";
import { ChunkId, ChunkVersionId, Path, SnippetId } from "../code/types";
import { initialUndoableState, Undoable } from "../types";
import { createState } from "./state-utils";

export const TEST_FILE_PATH = "file-path";
export const TEST_SNIPPET_ID = "snippet-0";

export function createStateWithChunks(...chunkVersions: ChunkVersionSpec[]): State {
  return createState({
    undoable: {
      present: createChunks(...chunkVersions)
    }
  });
}

/**
 * This is now the preferred method for creating test code data (instead of 'createUndoableWithSnippet').
 * Cells are created for the snippets in the order that they are referred to in the chunk version
 * specs. If the snippet ID for a chunk version is undefined, it will be 'TEST_SNIPPET_ID'; if the path
 * isn't set for a chunk version, it will be 'TEST_FILE_PATH'.
 */
export function createChunks(...chunkVersions: ChunkVersionSpec[]): Undoable {
  const state = createUndoable();
  for (const chunkVersion of chunkVersions) {
    const chunkVersionId = chunkVersion.chunkVersionId || uuidv4();
    const chunkId = chunkVersion.chunkId || uuidv4();
    let snippetId = chunkVersion.snippetId === undefined ? TEST_SNIPPET_ID : chunkVersion.snippetId;

    state.chunkVersions.all.push(chunkVersionId);
    state.chunkVersions.byId[chunkVersionId] = {
      chunk: chunkId,
      text: chunkVersion.text
    };
    if (state.chunks.all.indexOf(chunkId) === -1) {
      state.chunks.all.push(chunkId);
      state.chunks.byId[chunkId] = {
        location: { line: chunkVersion.line, path: chunkVersion.path || TEST_FILE_PATH },
        versions: []
      };
    }
    state.chunks.byId[chunkId].versions.push(chunkVersionId);
    if (snippetId !== null) {
      if (state.snippets.all.indexOf(snippetId) === -1) {
        state.snippets.all.push(snippetId);
        state.snippets.byId[snippetId] = { chunkVersionsAdded: [] };
        const cellId = uuidv4();
        state.cells.all.push(cellId);
        state.cells.byId[cellId] = { contentId: snippetId, type: ContentType.SNIPPET };
      }
      state.snippets.byId[snippetId].chunkVersionsAdded.push(chunkVersionId);
    }
  }
  return state;
}

interface ChunkVersionSpec {
  snippetId?: SnippetId;
  chunkId?: ChunkId;
  chunkVersionId?: ChunkVersionId;
  path?: Path;
  line: number;
  text: string;
}

/**
 * Generally, you should not use this method, as populating state with this method results in
 * very verbose data structures in test code. Try first to use 'createChunks'.
 */
export function createUndoable(partialState?: DeepPartial<Undoable>): Undoable {
  return _.merge({}, initialUndoableState, partialState);
}

/**
 * Generally, you should not use this method, as populating state with this method results in
 * very verbose data structures in test code. Try first to use 'createChunksWithState'.
 */
export function createStateWithUndoable(partialState?: DeepPartial<Undoable>): State {
  return createState({
    undoable: {
      present: createUndoable(partialState)
    }
  });
}
