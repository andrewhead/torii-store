import { DeepPartial } from "redux";
import { ChunkId, ChunkVersionId, Location } from "../../../src/text/chunks/types";
import { SnippetId } from "../../../src/text/snippets/types";
import { Text } from "../../../src/text/types";

export function createText(partialState?: DeepPartial<Text>): Text {
  const emptyState = {
    snippets: { all: [], byId: {} },
    chunks: { all: [], byId: {} },
    chunkVersions: { all: [], byId: {} },
    visibilityRules: {},
    selections: []
  };
  return Object.assign({}, emptyState, partialState);
}

export function createTextWithSnippets(
  snippetId: SnippetId,
  chunkId: ChunkId,
  chunkVersionId: ChunkVersionId,
  location: Location,
  text: string
) {
  return createText({
    snippets: {
      byId: {
        [snippetId]: {
          chunkVersionsAdded: [chunkVersionId]
        }
      },
      all: [snippetId]
    },
    chunks: {
      byId: {
        [chunkId]: {
          location: location,
          versions: [chunkVersionId]
        }
      },
      all: [chunkId]
    },
    chunkVersions: {
      byId: {
        [chunkVersionId]: {
          chunk: chunkId,
          text
        }
      },
      all: [chunkVersionId]
    }
  });
}
