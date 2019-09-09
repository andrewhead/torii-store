import { diff } from "deep-diff";
import LinguistLanguages, * as linguistLanguages from "linguist-languages";
import _ from "lodash";
import * as node_path from "path";
import { Cell, ContentType, OutputCell, SnippetCell, TextCell } from "../cells/types";
import { Path, SnippetId } from "../code/types";
import { State, Undoable } from "../state/types";
import * as stateUtils from "../util/state-utils";
import { getSnapshotPartialProgram, getSnippetPartialProgram } from "./code";
import { getSnippetPaths } from "./code/snippet";
import { isAddDiff, isArrayDiff, isEditDiff, PathElementPattern } from "./types";

export function getActivePaths(state: Undoable): Path[] {
  const paths = [];
  for (const chunkId of state.chunks.all) {
    const chunk = state.chunks.byId[chunkId];
    if (paths.indexOf(chunk.location.path) === -1) {
      paths.push(chunk.location.path);
    }
  }
  return paths;
}

export function isPathActive(path: Path, state: Undoable): boolean {
  return getActivePaths(state).indexOf(path) !== -1;
}

/**
 * Returns a list of IDs of snippets for which the snapshot of the code up to that snippet has
 * changed. 'before' is the state before change, and 'after' is the state after change.
 */
export function getChangedSnapshots(
  before: State | undefined,
  after: State | undefined
): SnippetId[] {
  before = before || stateUtils.createState();
  after = after || stateUtils.createState();
  let changedSnippets: SnippetId[] = [];
  const differences = diff(before, after);
  if (differences === undefined) {
    return changedSnippets;
  }
  for (const d of differences) {
    /*
     * A snippet has been added.
     */
    if (
      isArrayDiff(d) &&
      pathMatches(d.path, ["present", "snippets", "all"]) &&
      isAddDiff(d.item)
    ) {
      changedSnippets = _.union(changedSnippets, [d.item.rhs]);
    }
    /*
     * Chunks have been added to or removed from a snippet.
     */
    if (
      isArrayDiff(d) &&
      pathMatches(d.path, ["present", "snippets", "byId", undefined, "chunkVersionsAdded"])
    ) {
      const snippetId = d.path[d.path.length - 2] as SnippetId;
      changedSnippets = _.union(changedSnippets, [snippetId]);
    }
    /*
     * A chunk within a snippet has been edited.
     */
    if (
      isEditDiff(d) &&
      pathMatches(d.path, ["present", "chunkVersions", "byId", undefined, undefined])
    ) {
      const changedChunkVersionId = d.path[d.path.length - 2];
      if (typeof changedChunkVersionId === "string") {
        for (const snippetId of after.undoable.present.snippets.all) {
          const snippet = after.undoable.present.snippets.byId[snippetId];
          if (snippet.chunkVersionsAdded.indexOf(changedChunkVersionId) !== -1) {
            changedSnippets = _.union(changedSnippets, [snippetId]);
          }
        }
      }
    }
  }
  let afterFirstChangedSnippet = false;
  for (const cellId of after.undoable.present.cells.all) {
    const cell = after.undoable.present.cells.byId[cellId];
    if (cell.type === ContentType.SNIPPET) {
      const snippetId = cell.contentId;
      if (changedSnippets.indexOf(snippetId) !== -1) {
        afterFirstChangedSnippet = true;
      }
      if (afterFirstChangedSnippet) {
        changedSnippets = _.union(changedSnippets, [snippetId]);
      }
    }
  }
  return changedSnippets;
}

/**
 * Determine if a path matches a suffix. The suffix is expressed as a list of patterns to be
 * compared against each of the elements in the path. These patterns can be 'undefined'
 * (meaning to always match that element), a literal number or string to match, or a regular
 * expression that will be compared against the path element if the path element is a string.
 */
function pathMatches(path: DiffPath, suffixPattern: PathElementPattern[]) {
  const pathEnd = _.takeRight(path, suffixPattern.length);
  for (let i = 0; i < suffixPattern.length; i++) {
    const pathElement = pathEnd[i];
    const pattern = suffixPattern[i];
    if (pattern === undefined) {
      continue;
    }
    if (typeof pattern === "string" || typeof pattern === "number") {
      if (pathElement !== pattern) {
        return false;
      }
    } else if (pattern instanceof RegExp && typeof pathElement === "string") {
      if (!pathElement.match(pattern)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Get Markdown containing all of the contents of the current tutorial.
 */
export function getMarkdown(state: State): string {
  const cells = state.undoable.present.cells;
  return cells.all
    .map(id => cells.byId[id])
    .map(getCellMarkdown.bind(undefined, state))
    .join("\n\n");
}

function getCellMarkdown(state: State, cell: Cell) {
  let cellMarkdown = "";
  switch (cell.type) {
    case ContentType.TEXT:
      cellMarkdown = getTextCellMarkdown(state, cell);
      break;
    case ContentType.SNIPPET:
      cellMarkdown = [
        getSnippetCellMarkdown(state, cell),
        getSnapshotCellMarkdown(state, cell)
      ].join("\n");
      break;
    case ContentType.OUTPUT:
      cellMarkdown = getOutputCellMarkdown(state, cell);
  }
  if (cell.hidden === true) {
    cellMarkdown = wrapHidden(cellMarkdown);
  }
  return cellMarkdown;
}

function wrapHidden(markdown: string) {
  return `<div class="hidden-cell">\n${markdown}\n</div>`;
}

function getTextCellMarkdown(state: State, cell: TextCell) {
  const textId = cell.contentId;
  return state.undoable.present.texts.byId[textId].value;
}

function getSnippetCellMarkdown(state: State, cell: SnippetCell) {
  const snippetId = cell.contentId;
  const paths = getSnippetPaths(state, snippetId);
  const markdowns = [];
  for (const path of paths) {
    const text = getSnippetPartialProgram(state, snippetId, path).partialProgram.text;
    const language = getLanguage(path);
    markdowns.push("```" + (language || "") + `\n${text}` + "\n```");
  }
  return markdowns.join("\n\n");
}

function getSnapshotCellMarkdown(state: State, cell: SnippetCell) {
  const snippetId = cell.contentId;
  const paths = getSnippetPaths(state, snippetId);
  const markdowns = [];
  for (const path of paths) {
    const text = getSnapshotPartialProgram(state, snippetId, path).partialProgram.text;
    const language = getLanguage(path);
    markdowns.push(
      /*
       * Snapshot will has a class for being, though with the appropriate styles and Javascript,
       * users could be shown snapshots on demand.
       */
      "<div class='snapshot hidden'>\n```" + (language || "") + `\n${text}` + "\n```\n</div>"
    );
  }
  return markdowns.join("\n\n");
}

/**
 * Get the Linguist language associated with this file. Linguist languages are chosen because
 * this is the framework used for syntax-highlighting for GitHub-flavored Markdown, a very popular
 * implementation of Markdown.
 */
function getLanguage(path: Path) {
  const pathExt = node_path.extname(path);
  for (const languageName of Object.keys(linguistLanguages)) {
    const language = linguistLanguages[languageName] as LinguistLanguages.Language;
    if (
      language.extensions !== undefined &&
      language.extensions !== null &&
      language.extensions.some(ext => ext === pathExt)
    ) {
      return languageName;
    }
  }
  return null;
}

function getOutputCellMarkdown(state: State, cell: OutputCell) {
  const { snippetId, commandId } = cell.contentId;
  const output = state.outputs.byId[snippetId][commandId];
  const classes = `output ${output.type} ${output.state}`;
  if (output.type === "console") {
    return `<div class="${classes}">\n${output.log.contents}\n</div>`;
  }
  return "";
}
