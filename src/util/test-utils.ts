import _ from "lodash";
import { DeepPartial } from "redux";
import uuidv4 from "uuid/v4";
import { createStore, State } from "..";
import { CellId, ContentType } from "../cells/types";
import { simpleStoreInitialState } from "../common/reducers";
import { ChunkId, ChunkVersionId, Location, SnippetId } from "../text/types";
import { Undoable } from "../types";

export const TEST_FILE_PATH = "file-path";
export const TEST_SNIPPET_ID = "snippet-0";

export function createState(partialState?: DeepPartial<State>): State {
  const emptyState = createStore().getState();
  return _.merge({}, emptyState, partialState);
}

export function createUndoable(partialState?: DeepPartial<Undoable>): Undoable {
  const emptyState = {
    cells: simpleStoreInitialState(),
    snippets: simpleStoreInitialState(),
    chunks: simpleStoreInitialState(),
    chunkVersions: simpleStoreInitialState(),
    visibilityRules: {},
    selections: []
  };
  return _.merge({}, emptyState, partialState);
}

/**
 * This is now the preferred method for creating test text data (instead of 'createUndoableWithSnippet').
 * Cells are created for the snippets in the order that they are referred to in the chunk version
 * specs. All chunks are created with a path of 'TEST_FILE_PATH' as its path. If the snippet ID
 * for a chunk version isn't set, it will be set to 'TEST_SNIPPET_ID'
 */
export function createSnippets(
  ...chunkVersions: {
    snippetId?: SnippetId;
    chunkId?: ChunkId;
    chunkVersionId?: ChunkVersionId;
    line: number;
    text: string;
  }[]
): Undoable {
  const state = createUndoable();
  for (const chunkVersion of chunkVersions) {
    const chunkVersionId = chunkVersion.chunkVersionId || uuidv4();
    const chunkId = chunkVersion.chunkId || uuidv4();
    const snippetId = chunkVersion.snippetId || TEST_SNIPPET_ID;

    state.chunkVersions.all.push(chunkVersionId);
    state.chunkVersions.byId[chunkVersionId] = {
      chunk: chunkId,
      text: chunkVersion.text
    };
    if (state.chunks.all.indexOf(chunkId) === -1) {
      state.chunks.all.push(chunkId);
      state.chunks.byId[chunkId] = {
        location: { line: chunkVersion.line, path: TEST_FILE_PATH },
        versions: []
      };
    }
    state.chunks.byId[chunkId].versions.push(chunkVersionId);
    if (state.snippets.all.indexOf(snippetId) === -1) {
      state.snippets.all.push(snippetId);
      state.snippets.byId[snippetId] = { chunkVersionsAdded: [] };
      const cellId = uuidv4();
      state.cells.all.push(cellId);
      state.cells.byId[cellId] = { contentId: snippetId, type: ContentType.SNIPPET };
    }
    state.snippets.byId[snippetId].chunkVersionsAdded.push(chunkVersionId);
  }
  return state;
}

export function createUndoableWithSnippet(
  cellId: CellId,
  snippetId: SnippetId,
  chunkId: ChunkId,
  chunkVersionId: ChunkVersionId,
  location: Location,
  text: string
) {
  return createUndoable({
    cells: {
      byId: {
        [cellId]: {
          type: ContentType.SNIPPET,
          contentId: snippetId
        }
      },
      all: [cellId]
    },
    snippets: {
      byId: {
        [snippetId]: {
          chunkVersionsAdded: [chunkVersionId]
        }
      },
      all: [snippetId]
    },
    chunks: {
      byId: {
        [chunkId]: {
          location: location,
          versions: [chunkVersionId]
        }
      },
      all: [chunkId]
    },
    chunkVersions: {
      byId: {
        [chunkVersionId]: {
          chunk: chunkId,
          text
        }
      },
      all: [chunkVersionId]
    }
  });
}
