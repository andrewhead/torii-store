import { SimpleStore } from "../../common/types";

/**
 * Order of chunks in "all" field is meaningless, as these chunks will be from many different files.
 * Use the lineNumber and path properties of chunks if you want to sort them.
 */
export interface Chunks extends SimpleStore<ChunkId, Chunk> {}

export interface Chunk {
  location: Location;
  versions: ChunkVersionId[];
}

export type ChunkId = string;

/**
 * Spec for making a chunk; use to create a new snippet from text in a reference implementation.
 */
export interface InitialChunk {
  location: Location;
  text: string;
}

/**
 * Location of chunk in the reference version of the program (initial version, before edits
 * are made to the chunk in later stages of the tutorial.)
 */
export interface Location {
  /**
   * Line numbers start at one (first line has number '1').
   */
  line: number;
  path: Path;
}

export type Path = string;

export interface ChunkVersions extends SimpleStore<ChunkVersionId, ChunkVersion> {}

export interface ChunkVersion {
  text: string;
  chunk: ChunkId;
}

export type ChunkVersionId = string;
