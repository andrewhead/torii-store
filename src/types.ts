import { CellId, Cells } from "./cells/types";
import { Chunks, ChunkVersions, Selection, Snippets, VisibilityRules } from "./code/types";
import { simpleStoreInitialState } from "./common/reducers";

/**
 * The undoable partition of the store.
 */
export interface Undoable {
  selection: CellId | undefined;
  cells: Cells;
  snippets: Snippets;
  chunks: Chunks;
  chunkVersions: ChunkVersions;
  visibilityRules: VisibilityRules;
  selections: Selection[];
}

export const initialUndoableState: Undoable = {
  selection: undefined,
  cells: simpleStoreInitialState(),
  snippets: simpleStoreInitialState(),
  chunks: simpleStoreInitialState(),
  chunkVersions: simpleStoreInitialState(),
  visibilityRules: {},
  selections: []
};
