import { SimpleStore } from "../../common/types";
import { ChunkVersionId } from "./chunk";

/**
 * The order of snippet IDs in 'all' is not significant. If you care about the order of snippets,
 * you need to look for all cells of snippet type in the 'cells' field of the state.
 */
export interface Snippets extends SimpleStore<SnippetId, Snippet> {}

export interface Snippet {
  chunkVersionsAdded: ChunkVersionId[];
}

export type SnippetId = string;

/**
 * Overrides for line visibility. By default, lines from a chunk version are visible in the first
 * snippet they appear in, and hidden otherwise. You can override this by setting visibility
 * rules. These can be set to show / hide lines from any chunk version included in this snippet,
 * or that was included in a snippet that preceded it.
 */
export interface VisibilityRules {
  [snippetId: string]: {
    [chunkVersionId: string]: {
      /**
       * Line number is relative to the start of the chunk version text (starts at 0).
       * It's the store's responsibility to update this number as the chunk version is edited.
       */
      [line: number]: visibility.Visibility;
    };
  };
}

export namespace visibility {
  export const HIDDEN = "HIDDEN";
  export const VISIBLE = "VISIBLE";
  export type Visibility = typeof HIDDEN | typeof VISIBLE;
}
