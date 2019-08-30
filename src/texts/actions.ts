import { SetTextAction, textActionNames as names, TextId } from "./types";

export function setText(id: TextId, value: string): SetTextAction {
  return {
    id,
    value,
    type: names.SET_TEXT
  };
}
