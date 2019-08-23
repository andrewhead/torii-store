import _ from "lodash";
import { DeepPartial } from "redux";
import { createStore, State } from "..";
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
    cells: { all: [], byId: {} },
    snippets: { all: [], byId: {} },
    chunks: { all: [], byId: {} },
    chunkVersions: { all: [], byId: {} },
    visibilityRules: {},
    selections: []
  };
  return _.merge({}, emptyState, partialState);
}

/**
 * Snippet is created with the value of 'TEST_FILE_PATH' as its path and with the value of
 * 'TEST_SNIPPET_ID' as its snippet ID.
 */
export function createSnippetWithChunkVersions(
  ...chunkTexts: { id?: string; chunkId?: string; line: number; text: string }[]
): Undoable {
  const state = createUndoable({
    snippets: {
      all: [TEST_SNIPPET_ID],
      byId: {
        [TEST_SNIPPET_ID]: {
          chunkVersionsAdded: []
        }
      }
    }
  });
  /*
   * Assume all chunks came from contigous locations in th eoriginal file.
   */
  for (let i = 0; i < chunkTexts.length; i++) {
    const chunkVersionId = chunkTexts[i].id || "chunk-version-" + i;
    const chunkId = chunkTexts[i].chunkId || "chunk-" + i;
    state.snippets.byId[TEST_SNIPPET_ID].chunkVersionsAdded.push(chunkVersionId);
    if (state.chunks.all.indexOf(chunkId) === -1) {
      state.chunks.all.push(chunkId);
      state.chunks.byId[chunkId] = {
        location: { line: chunkTexts[i].line, path: TEST_FILE_PATH },
        versions: [chunkVersionId]
      };
    } else {
      state.chunks.byId[chunkId].versions.push(chunkVersionId);
    }
    state.chunkVersions.all.push(chunkVersionId);
    state.chunkVersions.byId[chunkVersionId] = {
      chunk: chunkId,
      text: chunkTexts[i].text
    };
  }
  return state;
}

export function createUndoableWithSnippets(
  snippetId: SnippetId,
  chunkId: ChunkId,
  chunkVersionId: ChunkVersionId,
  location: Location,
  text: string
) {
  return createUndoable({
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
