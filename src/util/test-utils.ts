import _ from "lodash";
import { DeepPartial } from "redux";
import uuidv4 from "uuid/v4";
import { CellId, ContentType } from "../cells/types";
import { ChunkId, ChunkVersionId, Location, Path, SnippetId } from "../code/types";
import { CommandId } from "../outputs/types";
import { initialUndoableState, State, Undoable } from "../state/types";
import { TextId } from "../texts/types";
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
    const cellId = chunkVersion.cellId || uuidv4();

    state.chunkVersions.all.push(chunkVersionId);
    state.chunkVersions.byId[chunkVersionId] = {
      chunk: chunkId,
      text: chunkVersion.text || "text"
    };
    if (state.chunks.all.indexOf(chunkId) === -1) {
      state.chunks.all.push(chunkId);
      state.chunks.byId[chunkId] = {
        location: { line: chunkVersion.line || 0, path: chunkVersion.path || TEST_FILE_PATH },
        versions: []
      };
    }
    state.chunks.byId[chunkId].versions.push(chunkVersionId);
    if (snippetId !== null) {
      if (state.snippets.all.indexOf(snippetId) === -1) {
        state.snippets.all.push(snippetId);
        state.snippets.byId[snippetId] = { chunkVersionsAdded: [] };
        state.cells.all.push(cellId);
        state.cells.byId[cellId] = {
          contentId: snippetId,
          type: ContentType.SNIPPET,
          hidden: false
        };
      }
      state.snippets.byId[snippetId].chunkVersionsAdded.push(chunkVersionId);
    }
  }
  return state;
}

interface ChunkVersionSpec {
  cellId?: CellId;
  snippetId?: SnippetId;
  chunkId?: ChunkId;
  chunkVersionId?: ChunkVersionId;
  path?: Path;
  line?: number;
  text?: string;
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

export function addCell(
  state: Undoable,
  id: CellId,
  type: ContentType,
  contentId: any,
  hidden: boolean
) {
  state.cells.all.push(id);
  state.cells.byId[id] = { type, contentId, hidden };
}

export function addText(state: Undoable, id: TextId, value: string) {
  state.texts.all.push(id);
  state.texts.byId[id] = { value };
}

export function addSnippet(
  state: Undoable,
  id: SnippetId,
  ...chunkVersionsAdded: ChunkVersionId[]
) {
  state.snippets.all.push(id);
  state.snippets.byId[id] = { chunkVersionsAdded };
}

export function addChunk(
  state: Undoable,
  id: ChunkId,
  location: Location,
  ...versions: ChunkVersionId[]
) {
  state.chunks.all.push(id);
  state.chunks.byId[id] = { location, versions };
}

export function addChunkVersion(state: Undoable, id: ChunkVersionId, chunk: ChunkId, text: string) {
  state.chunkVersions.all.push(id);
  state.chunkVersions.byId[id] = { chunk, text };
}

export function addConsoleOutput(
  state: State,
  snippetId: SnippetId,
  commandId: CommandId,
  output: string
) {
  state.outputs.all.push(snippetId);
  state.outputs.byId[snippetId] = {
    [commandId]: {
      commandId,
      type: "console",
      state: "finished",
      log: {
        contents: output,
        stdoutRanges: [{ start: 0, end: output.length }],
        stderrRanges: []
      }
    }
  };
}
