import { ChunkId, ChunkVersionId, Path, Position, SnippetId, visibility } from "../../code/types";

export interface PartialProgram {
  text: string;
  visibilities: (visibility.Visibility | undefined)[];
  selections: SnippetSelection[];
  chunkVersionOffsets: ChunkVersionOffsets;
  path: Path;
  /**
   * The ID of whatever chunk version is currently selected. If there are no selections in the
   * code editor, or if selections are made in multiple chunk versions, this will be 'undefined'.
   */
  selectedChunkVersionId: ChunkVersionId | undefined;
}

export type LineFilter = (
  chunkVersionId: ChunkVersionId,
  /*
   * Offset of line within chunk. Starts at zero.
   */
  offset: number
) => boolean;

export interface LineText {
  text: string;
  snippetId: SnippetId;
  chunkId: ChunkId;
  chunkVersionId: ChunkVersionId;
  /**
   * Offset of line in a set of ordered chunk versions. Starts at 1.
   */
  offset: number;
  visibility: visibility.Visibility | undefined;
}

export interface ChunkVersionsByPath {
  [path: string]: ChunkVersionId[];
}

export interface ChunkVersionIdToSnippetIdMap {
  [chunkVersionId: string]: SnippetId;
}

/**
 * Compared to 'Selection' in santoku-store, these selections are used solely as pointers to
 * regions where selections should be made in a snippet editor. They are created for a specific
 * snippet, so they don't need any information about the paths or chunks they're from.
 */
export interface SnippetSelection {
  anchor: Position;
  active: Position;
}

export type ChunkVersionOffsets = ChunkVersionOffset[];

interface ChunkVersionOffset {
  /**
   * Line index, offset of where a chunk version appears in a snippet. First line is 1.
   */
  line: number;
  chunkVersionId: ChunkVersionId;
}

/**
 * Contents of all files in a snapshot of a program. The key in this dictionary is a path to the
 * file from the refernce implementation, and the value is the contents of that file in this
 * snapshot of the program.
 */
export interface FileContents {
  [filePath: string]: string;
}
