import { SimpleStore } from "../../common/types";
import { SnippetId } from "../../text/types";

export interface Cells extends SimpleStore<CellId, Cell> {}

export enum ContentType {
  SNIPPET
}

export interface Cell {
  contentId: SnippetId;
  type: ContentType;
}

/**
 * Cell ID is distinct from the ID of the content (e.g., a snippet ID). Content IDs should be
 * unique within the store for that content type. Cell IDs need to be unique across all cells.
 */
export type CellId = string;
