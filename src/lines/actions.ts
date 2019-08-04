import uuidv4 from "uuid/v4";
import * as names from "./action-names";
import {
  CreateLineAction,
  LineVersionId,
  Location,
  UpdateTextAction,
  UpdateTextAtLocationAction
} from "./types";

export function updateText(lineVersionId: LineVersionId, text: string): UpdateTextAction {
  return {
    lineVersionId,
    text,
    type: names.UPDATE_TEXT
  };
}

export function updateTextAtLocation(
  location: Location,
  text: string,
  version: number
): UpdateTextAtLocationAction {
  return {
    location,
    text,
    version,
    type: names.UPDATE_TEXT_AT_LOCATION
  };
}

/**
 * @param insert offset all lines at the same path with a higher index.
 */
export function createLine(
  location: Location,
  initialVersionText?: string,
  insert?: boolean
): CreateLineAction {
  const id = uuidv4();
  const initialVersionId = initialVersionText !== undefined ? uuidv4() : undefined;
  return {
    id,
    initialVersionId,
    initialVersionText,
    insert: insert !== undefined ? insert : false,
    location,
    type: names.CREATE_LINE
  };
}

/*
export function removeLine(id: LineId): LineActionTypes {
    return {
        id,
        type: REMOVE_LINE
    }
}
*/
