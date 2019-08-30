import { SimpleStore } from "../../common/types";

export interface Texts extends SimpleStore<TextId, Text> {}

export interface Text {
  /**
   * Initialized to 'undefined'.
   */
  value: string | undefined;
}

export type TextId = string;
