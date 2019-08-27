import _ from "lodash";
import { Path } from "../text/types";
import { Undoable } from "../types";
import * as textUtils from "../util/text-utils";

export function getReferenceImplementationText(text: Undoable, path: Path): string {
  const chunkIds = text.chunks.all;
  const chunks = chunkIds
    .map(id => text.chunks.byId[id])
    .filter(chunk => _.isEqual(chunk.location.path, path))
    .filter(chunk => chunk.versions.length >= 1);
  chunks.sort((chunk1, chunk2) => chunk1.location.line - chunk2.location.line);
  return textUtils.join(
    ...chunks
      .map(chunk => chunk.versions[0])
      .map(chunkVersionId => text.chunkVersions.byId[chunkVersionId])
      .map(chunkVersion => chunkVersion.text)
  );
}
