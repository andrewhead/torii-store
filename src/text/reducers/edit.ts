import _ from "lodash";
import * as textUtils from "../../util/text-utils";
import { ChunkId, ChunkVersionId } from "../chunks/types";
import { EditAction, Range, SourcedRange, SourceType, Text } from "../types";
import { getChunkInfo } from "./common";

export function edit(state: Text, action: EditAction) {
  const { range, newText } = action.edit;
  let updatedState = state;
  let referenceImplementationLine;
  if (range.relativeTo.source === SourceType.CHUNK_VERSION) {
    const { version, startLine } = getChunkInfo(state, range.relativeTo.chunkVersionId);
    updatedState = updateChunkVersionText(state, range.relativeTo.chunkVersionId, range, newText);
    if (version === 0) {
      referenceImplementationLine = startLine + range.start.line - 1;
    }
  } else if (range.relativeTo.source === SourceType.REFERENCE_IMPLEMENTATION) {
    updatedState = updateChunkVersionsFromReferenceImplementationEdit(state, range, newText);
    referenceImplementationLine = range.start.line;
  }
  /*
   * Keep chunks consistent with the reference implementation. Update the chunk data to make
   * sure they're still at the right offsets relative to the reference implementation.
   */
  if (referenceImplementationLine !== undefined) {
    updatedState = updateChunkOffsets(updatedState, referenceImplementationLine, range, newText);
  }
  return updatedState;
}

function updateChunkVersionsFromReferenceImplementationEdit(
  state: Text,
  range: Range,
  newText: string
) {
  for (const chunkVersionId of state.chunkVersions.all) {
    const { startLine, endLine, version } = getChunkInfo(state, chunkVersionId);
    if (version === 0 && range.start.line >= startLine && range.end.line <= endLine) {
      const rangeWithinChunkVersion = {
        start: { ...range.start, line: range.start.line - startLine + 1 },
        end: { ...range.end, line: range.end.line - startLine + 1 }
      };
      state = updateChunkVersionText(state, chunkVersionId, rangeWithinChunkVersion, newText);
    }
  }
  return state;
}

/**
 * 'range' is relative to the start of the chunk version's text.
 */
function updateChunkVersionText(
  state: Text,
  chunkVersionId: ChunkVersionId,
  range: Range,
  newText: string
) {
  const chunkVersion = state.chunkVersions.byId[chunkVersionId];
  const newChunkVersionText = textUtils.replace(chunkVersion.text, range, newText);
  return _.merge({}, state, {
    chunkVersions: {
      byId: {
        [chunkVersionId]: {
          text: newChunkVersionText
        }
      }
    }
  });
}

function updateChunkOffsets(
  state: Text,
  referenceImplementationLine: number,
  range: SourcedRange,
  newText: string
): Text {
  const linesBefore = range.end.line - range.start.line + 1;
  const linesAfter = textUtils.toLines(newText).length;
  const linesChanged = linesAfter - linesBefore;
  if (linesChanged !== 0) {
    for (const chunkId of state.chunks.all) {
      const chunk = state.chunks.byId[chunkId];
      if (
        _.isEqual(chunk.location.path, range.path) &&
        chunk.location.line > referenceImplementationLine
      ) {
        state = moveChunk(state, chunkId, linesChanged);
      }
    }
  }
  return state;
}

function moveChunk(state: Text, chunkId: ChunkId, delta: number) {
  const line = state.chunks.byId[chunkId].location.line;
  return _.merge({}, state, {
    chunks: {
      byId: {
        [chunkId]: {
          location: {
            line: line + delta
          }
        }
      }
    }
  });
}
