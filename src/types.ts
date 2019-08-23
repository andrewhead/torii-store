import { Chunks, ChunkVersions } from "./text/chunks/types";
import { Snippets, VisibilityRules } from "./text/snippets/types";
import { Selection } from "./text/types";

/**
 * The undoable partition of the store.
 */
export interface Undoable {
  snippets: Snippets;
  chunks: Chunks;
  chunkVersions: ChunkVersions;
  visibilityRules: VisibilityRules;
  selections: Selection[];
}
