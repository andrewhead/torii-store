import _ from "lodash";
import { ContentType } from "../../cells/types";
import { ChunkId, ChunkVersionId, Path, SnippetId } from "../../code/types";
import { State, Undoable } from "../../state/types";
import * as textUtils from "../../util/text-utils";
import { FileContents } from "./types";

/**
 * Get IDs of snippets in the order they appear in cells.
 */
export function getSnippetIdsInCellOrder(code: Undoable): SnippetId[] {
  return code.cells.all
    .map(id => code.cells.byId[id])
    .filter(c => c.type === ContentType.SNIPPET)
    .map(c => c.contentId as SnippetId);
}

/**
 * Can be the ID of a version for a chunk that appears before a snippet, and can also be a chunk
 * version from the reference implementation that hasn't been added to the tutorial.
 */
export function findIdOfPreviousChunkVersion(
  state: Undoable,
  snippetId: SnippetId,
  chunkVersionId: ChunkVersionId
): ChunkVersionId | null {
  const chunkId = state.chunkVersions.byId[chunkVersionId].chunk;
  const snippetIds = getSnippetIdsInCellOrder(state);
  const snippetIndex = snippetIds.indexOf(snippetId);
  for (let i = snippetIndex - 1; i >= 0; i--) {
    const previousSnippet = state.snippets.byId[snippetIds[i]];
    for (const previousChunkVersionId of previousSnippet.chunkVersionsAdded) {
      const previousChunkId = state.chunkVersions.byId[previousChunkVersionId].chunk;
      if (previousChunkId === chunkId) {
        return previousChunkVersionId;
      }
    }
  }
  const chunk = state.chunks.byId[chunkId];
  const versionIndex = chunk.versions.indexOf(chunkVersionId);
  if (versionIndex > 0) {
    return chunk.versions[0];
  }
  return null;
}

export function getReferenceImplementationText(code: Undoable, path: Path): string {
  const chunkIds = code.chunks.all;
  const chunks = chunkIds
    .map(id => code.chunks.byId[id])
    .filter(chunk => _.isEqual(chunk.location.path, path))
    .filter(chunk => chunk.versions.length >= 1);
  chunks.sort((chunk1, chunk2) => chunk1.location.line - chunk2.location.line);
  return textUtils.join(
    ...chunks
      .map(chunk => chunk.versions[0])
      .map(chunkVersionId => code.chunkVersions.byId[chunkVersionId])
      .map(chunkVersion => chunkVersion.text)
  );
}

/**
 * Get file contents of the program as of the snippet indicated by 'snippetId'.
 * Assumes 'snippetId' is valid. If it is not, this function returns the file contents
 * as of the last snippet.
 */
export function getFileContents(state: State, until: SnippetId): FileContents {
  const chunkVersionsByPath = getSortedChunkVersionsGroupedByPath(state, until);
  const fileContents: FileContents = {};
  for (const path of Object.keys(chunkVersionsByPath)) {
    for (const chunkVersionId of chunkVersionsByPath[path]) {
      const chunkVersion = state.undoable.present.chunkVersions.byId[chunkVersionId];
      const chunkText = chunkVersion.text;
      fileContents[path] = textUtils.join(fileContents[path], chunkText);
    }
  }
  return fileContents;
}

/**
 * Get ordered list of all chunk versions that will appear in a snapshot of a program for a path.
 */
export function getSnapshotOrderedChunkVersions(state: State, snippetId: SnippetId, path: Path) {
  const chunkVersionsByPath = getSortedChunkVersionsGroupedByPath(state, snippetId);
  return chunkVersionsByPath[path];
}

function getSortedChunkVersionsGroupedByPath(state: State, until: SnippetId) {
  const pathChunkVersions = getLastChunkVersionsGroupedByPath(state, until);
  const sortedChunkVersions = {};
  for (const path of Object.keys(pathChunkVersions)) {
    const chunkIds = sortChunkIds(state, Object.keys(pathChunkVersions[path]));
    for (const chunkId of chunkIds) {
      const chunkVersionId = pathChunkVersions[path][chunkId];
      if (sortedChunkVersions[path] === undefined) {
        sortedChunkVersions[path] = [];
      }
      sortedChunkVersions[path].push(chunkVersionId);
    }
  }
  return sortedChunkVersions;
}

/**
 * Sort chunk IDs by line order.
 */
function sortChunkIds(state: State, chunkIds: ChunkId[]) {
  const stateSlice = state.undoable.present;
  const sorted = [...chunkIds];
  sorted.sort((chunkId1, chunkId2) => {
    const chunk1 = stateSlice.chunks.byId[chunkId1];
    const chunk2 = stateSlice.chunks.byId[chunkId2];
    return chunk1.location.line - chunk2.location.line;
  });
  return sorted;
}

/**
 * Get the latest chunk version for each chunk that appears up to the snippet ID 'until'.
 */
function getLastChunkVersionsGroupedByPath(state: State, until: SnippetId) {
  const stateSlice = state.undoable.present;
  const cells = stateSlice.cells;
  const pathChunkVersions: PathChunkVersions = {};
  for (const cellId of cells.all) {
    const cell = cells.byId[cellId];
    if (cell.type === ContentType.SNIPPET) {
      const snippetId = cell.contentId;
      const snippet = stateSlice.snippets.byId[snippetId];
      for (const chunkVersionId of snippet.chunkVersionsAdded) {
        const chunkVersion = stateSlice.chunkVersions.byId[chunkVersionId];
        const chunkId = chunkVersion.chunk;
        const path = stateSlice.chunks.byId[chunkId].location.path;
        if (pathChunkVersions[path] === undefined) {
          pathChunkVersions[path] = {};
        }
        pathChunkVersions[path][chunkId] = chunkVersionId;
      }
      if (_.isEqual(snippetId, until)) {
        break;
      }
    }
  }
  return pathChunkVersions;
}

type PathChunkVersions = {
  [path: string]: {
    [chunkId: string]: ChunkVersionId;
  };
};
