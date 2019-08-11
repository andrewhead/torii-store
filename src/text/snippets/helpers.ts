import { ById } from "../types";
import { Snippet, SnippetId, Snippets, VisibilityRules, VisibilityRulesUpdates } from "./types";
import _ from "lodash";

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

export function updateVisibilityRules(state: VisibilityRules, updates: VisibilityRulesUpdates) {
  state = _.merge({}, state, updates.add, updates.update);
  for (const [snippetId, chunkVersionId, line] of updates.delete) {
    delete state[snippetId][chunkVersionId][line];
    if (Object.keys(state[snippetId][chunkVersionId]).length === 0) {
      delete state[snippetId][chunkVersionId];
    }
    if (Object.keys(state[snippetId]).length === 0) {
      delete state[snippetId];
    }
  }
  return state;
}