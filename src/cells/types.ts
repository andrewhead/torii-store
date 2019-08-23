import { SimpleStore } from "../common/types";
import { Snippet, SnippetId } from "../text/types";

export interface Cells extends SimpleStore<CellId, Cell> {}

export const ContentType = {
  SNIPPET: "snippet"
};

export interface Cell {
  contentId: SnippetId;
  type: Snippet;
}

export type CellId = string;
