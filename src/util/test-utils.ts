import { Text } from "../text/types";

export const TEST_FILE_PATH = "file-path";
export const TEST_SNIPPET_ID = "snippet-0";

/**
 * Snippet is created with the value of 'TEST_FILE_PATH' as its path and with the value of
 * 'TEST_SNIPPET_ID' as its snippet ID.
 */
export function createSnippetWithChunkVersions(
  ...chunkTexts: { id?: string; chunkId?: string; line: number; text: string }[]
): Text {
  const text = {
    snippets: {
      all: [TEST_SNIPPET_ID],
      byId: {
        [TEST_SNIPPET_ID]: {
          chunkVersionsAdded: []
        }
      }
    },
    chunks: { all: [], byId: {} },
    chunkVersions: { all: [], byId: {} },
    visibilityRules: {},
    selections: []
  };
  /*
   * Assume all chunks came from contigous locations in th eoriginal file.
   */
  for (let i = 0; i < chunkTexts.length; i++) {
    const chunkVersionId = chunkTexts[i].id || "chunk-version-" + i;
    const chunkId = chunkTexts[i].chunkId || "chunk-" + i;
    text.snippets.byId[TEST_SNIPPET_ID].chunkVersionsAdded.push(chunkVersionId);
    if (text.chunks.all.indexOf(chunkId) === -1) {
      text.chunks.all.push(chunkId);
      text.chunks.byId[chunkId] = {
        location: { line: chunkTexts[i].line, path: TEST_FILE_PATH },
        versions: [chunkVersionId]
      };
    } else {
      text.chunks.byId[chunkId].versions.push(chunkVersionId);
    }
    text.chunkVersions.all.push(chunkVersionId);
    text.chunkVersions.byId[chunkVersionId] = {
      chunk: chunkId,
      text: chunkTexts[i].text
    };
  }
  return text;
}
