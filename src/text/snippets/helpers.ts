import { ById } from "../types";
import { Snippet, SnippetId, Snippets, VisibilityRules } from "./types";

export const snippetsInitialState: Snippets = {
  all: [],
  byId: {}
};

export const visibilityRulesInitialState: VisibilityRules = {};

export function insertSnippet(
  state: Snippets,
  id: SnippetId,
  index: number,
  snippet: Snippet
): Snippets {
  return {
    ...state,
    all: insertSnippetInAllSnippets(state.all, index, id),
    byId: insertSnippetById(state.byId, id, snippet)
  };
}

function insertSnippetById(state: ById<Snippet>, id: SnippetId, snippet: Snippet): ById<Snippet> {
  return {
    ...state,
    [id]: snippet
  };
}

function insertSnippetInAllSnippets(state: SnippetId[], index: number, id: SnippetId): SnippetId[] {
  return state
    .slice(0, index)
    .concat(id)
    .concat(state.slice(index, state.length));
}
