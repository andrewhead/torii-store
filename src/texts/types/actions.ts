import { AnyAction } from "redux";
import * as names from "./action-names";
import { TextId } from "./text";

export interface SetTextAction {
  type: typeof names.SET_TEXT;
  id: TextId;
  value: string;
}

export type TextActionTypes = SetTextAction;

export function isTextAction(action: AnyAction): action is TextActionTypes {
  return Object.keys(names).indexOf(action.type) !== -1;
}
