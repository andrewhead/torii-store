import { DeepPartial } from "redux";
import { Text } from "../../../src/text/types";

export function createText(partialState?: DeepPartial<Text>): Text {
  const emptyState = {
    snippets: { all: [], byId: {} },
    chunks: { all: [], byId: {} },
    chunkVersions: { all: [], byId: {} },
    visibilityRules: {}
  };
  return Object.assign({}, emptyState, partialState);
}
