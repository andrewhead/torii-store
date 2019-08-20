import { Position, Range, Selection } from "./text/types";

export const NEWLINE = /\n/;

export function toLines(text: string) {
  return text.split(NEWLINE);
}

export function join(...lines: string[]) {
  return lines.join("\n");
}

/**
 * Constrain selection to intersection with range. Returns new selection; does not modify parameters.
 */
export function intersect(selection: Selection, range: Range) {
  return {
    ...selection,
    anchor: first(range.end, last(selection.anchor, range.start)),
    active: first(range.end, last(selection.active, range.start))
  };
}

/**
 * Returns the first of a list of points.
 */
function first(...positions: Position[]) {
  return sort(...positions)[0];
}

/**
 * Returns the second of two points.
 */
function last(...positions: Position[]) {
  return sort(...positions)[positions.length - 1];
}

function sort(...positions: Position[]) {
  positions.sort(compare);
  return positions;
}

/**
 * Compare two positions. Return -1 if position1 is first, 0 if the positions are the same, and
 * 1 if position2 is first.
 */
export function compare(p1: Position, p2: Position) {
  if (p1.line < p2.line) {
    return -1;
  } else if (p1.line > p2.line) {
    return 1;
  } else if (p1.character < p2.character) {
    return -1;
  } else if (p1.character > p2.character) {
    return 1;
  }
  return 0;
}
