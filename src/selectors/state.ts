import { diff } from "deep-diff";
import _ from "lodash";
import { ContentType } from "../cells/types";
import { Path, SnippetId } from "../code/types";
import { State, Undoable } from "../state/types";
import * as stateUtils from "../util/state-utils";
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
