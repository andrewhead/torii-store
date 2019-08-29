import _ from "lodash";
import { ContentType, State } from "..";
import { ChunkVersionId, Path, SnippetId } from "../code/types";
import { Undoable } from "../types";
import * as textUtils from "../util/text-utils";
import { FileContents } from "./types";

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
  const fileContents: FileContents = {};
  for (const path of Object.keys(pathChunkVersions)) {
    const chunkIds = Object.keys(pathChunkVersions[path]);
    chunkIds.sort((chunkId1, chunkId2) => {
      const chunk1 = stateSlice.chunks.byId[chunkId1];
      const chunk2 = stateSlice.chunks.byId[chunkId2];
      return chunk1.location.line - chunk2.location.line;
    });
    for (const chunkId of chunkIds) {
      const chunkVersionId = pathChunkVersions[path][chunkId];
      const chunkVersion = stateSlice.chunkVersions.byId[chunkVersionId];
      const chunkText = chunkVersion.text;
      fileContents[path] = textUtils.join(fileContents[path], chunkText);
    }
  }
  return fileContents;
}

type PathChunkVersions = {
  [path: string]: {
    [chunkId: string]: ChunkVersionId;
  };
};
