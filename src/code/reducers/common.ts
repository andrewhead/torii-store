import _ from "lodash";
import uuidv4 from "uuid/v4";
import { Undoable } from "../../types";
import * as textUtils from "../../util/text-utils";
import { ChunkId, ChunkVersionId, InitialChunk } from "../types";
import { CodeUpdates, emptyCodeUpdates, mergeCodeUpdates } from "./update";

export function addChunks(initialChunks: InitialChunk[]): CodeUpdates {
  const updates = emptyCodeUpdates();
  for (const chunkData of initialChunks) {
    const { text, location } = chunkData;
    /*
     * TODO(andrewhead): these chunk names should be determined deterministically (e.g., by
     * appending a character to the end of them). Using random number generators to influence
     * values in the store goes against Redux's guidelines.
     */
    const chunkId = uuidv4();
    const chunkVersionId = uuidv4();
    updates.chunks.add[chunkId] = {
      location,
      versions: [chunkVersionId]
    };
    updates.chunkVersions.add[chunkVersionId] = {
      text,
      chunk: chunkId
    };
  }
  return updates;
}

export function splitIntoLines(initialChunks: InitialChunk[]): ChunkLines {
  const chunkLines: ChunkLines = {};
  for (const initialChunk of initialChunks) {
    const lines = textUtils.split(initialChunk.text);
    const { path, line: lineNumber } = initialChunk.location;
    for (let lineOffset = 0; lineOffset < lines.length; lineOffset++) {
      _.merge(chunkLines, {
        [path]: {
          [lineNumber + lineOffset]: lines[lineOffset]
        }
      });
    }
  }
  return chunkLines;
}

export function mergeIntoInitialChunks(chunkLines: ChunkLines): InitialChunk[] {
  const initialChunks = [];
  for (const path of Object.keys(chunkLines)) {
    let lastLine: number;
    let initialChunk: InitialChunk;
    for (const line of Object.keys(chunkLines[path]).map(l => Number(l))) {
      if (lastLine === undefined || line > lastLine + 1) {
        if (initialChunk !== undefined) {
          initialChunks.push(initialChunk);
        }
        initialChunk = {
          location: { path, line: Number(line) },
          text: chunkLines[path][line]
        };
      } else if (line === lastLine + 1) {
        initialChunk.text += "\n" + chunkLines[path][line];
      }
      lastLine = line;
    }
    if (initialChunk !== undefined) {
      initialChunks.push(initialChunk);
    }
  }
  return initialChunks;
}

/**
 * Assumes that this is only ever called on chunks with only one version.
 */
export function removeLines(state: Undoable, chunkId: ChunkId, lines: number[]): CodeUpdates {
  let updates = emptyCodeUpdates();
  const chunk = state.chunks.byId[chunkId];
  const chunkVersionId = chunk.versions[0];
  const chunkVersion = state.chunkVersions.byId[chunkVersionId];
  const chunkLines = splitIntoLines([{ location: chunk.location, text: chunkVersion.text }]);
  for (const line of lines) {
    delete chunkLines[chunk.location.path][line];
  }
  const initialChunks = mergeIntoInitialChunks(chunkLines);
  const additions = addChunks(initialChunks);
  updates = mergeCodeUpdates(updates, additions);
  for (const snippetId of state.snippets.all) {
    const snippet = state.snippets.byId[snippetId];
    const chunkVersionIndex = snippet.chunkVersionsAdded.indexOf(chunkVersionId);
    const chunkVersionsAdded = [...snippet.chunkVersionsAdded];
    if (chunkVersionIndex !== -1) {
      chunkVersionsAdded.splice(chunkVersionIndex, 1);
      chunkVersionsAdded.push(...Object.keys(additions.chunkVersions.add));
      updates.snippets.update[snippetId] = { chunkVersionsAdded };
    }
  }
  updates.chunks.delete.push(chunkId);
  updates.chunkVersions.delete.push(chunkVersionId);
  return updates;
}

export function getSnippet(state: Undoable, index: number) {
  return state.snippets.byId[state.snippets.all[index]];
}

export function getChunkInfo(state: Undoable, chunkVersionId: ChunkVersionId) {
  const chunkVersion = state.chunkVersions.byId[chunkVersionId];
  const chunk = state.chunks.byId[chunkVersion.chunk];
  return {
    chunkId: chunkVersion.chunk,
    version: chunk.versions.indexOf(chunkVersionId),
    ofVersions: chunk.versions.length,
    path: chunk.location.path,
    startLine: chunk.location.line,
    endLine: chunk.location.line + textUtils.split(chunkVersion.text).length - 1,
    text: chunkVersion.text
  };
}

interface ChunkLines {
  [pathIdentifier: string]: {
    [line: number]: string;
  };
}
