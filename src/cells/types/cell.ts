import { SimpleStore } from "../../common/types";
import { OutputId } from "../../outputs/types";
import { SnippetId } from "../../text/types";

export interface Cells extends SimpleStore<CellId, Cell> {}

export type Cell = SnippetCell | OutputCell;

export interface SnippetCell extends BaseCell {
  type: ContentType.SNIPPET;
  contentId: SnippetId;
}

export interface OutputCell extends BaseCell {
  type: ContentType.OUTPUT;
  contentId: OutputId;
}

interface BaseCell {
  type: ContentType;
  /**
   * Should be either a string for a simple ID, or a dictionary for a compound ID, where each key
   * in the dictionary is a descriptive name of the part of the ID and each value is the ID.
   */
  contentId: any;
}

export enum ContentType {
  SNIPPET,
  OUTPUT
}

/**
 * Cell ID is distinct from the ID of the content (e.g., a snippet ID). Content IDs should be
 * unique within the store for that content type. Cell IDs need to be unique across all cells.
 */
export type CellId = string;
