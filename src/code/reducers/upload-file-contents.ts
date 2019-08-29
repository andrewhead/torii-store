import _ from "lodash";
import { Undoable } from "../../types";
import { UploadFileContentsAction } from "../types";

export function uploadFileContents(state: Undoable, action: UploadFileContentsAction): Undoable {
  const chunks = _.merge({}, state.chunks, {
    all: state.chunks.all.concat(action.chunkId),
    byId: {
      [action.chunkId]: {
        location: { line: 1, path: action.path },
        versions: [action.chunkVersionId]
      }
    }
  });
  const chunkVersions = _.merge({}, state.chunkVersions, {
    all: state.chunks.all.concat(action.chunkVersionId),
    byId: {
      [action.chunkVersionId]: {
        text: action.contents,
        chunk: action.chunkId
      }
    }
  });
  return {
    ...state,
    chunks,
    chunkVersions
  };
}
