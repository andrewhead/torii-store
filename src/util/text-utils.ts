import { Position, Range, Selection } from "../text/types";

export const NEWLINE = /\n/;

export function toLines(text: string) {
  return text.split(NEWLINE);
}

export function join(...lines: string[]) {
  return lines.join("\n");
}

/**
 * Replace 'range' of characters in string 'str' with 'newText'. Returns null if range is invalid
 * (i.e. it doesn't fall in the bounds of the string).
 */
export function replace(str: string, range: Range, newText: string): string | null {
  const lines = toLines(str);
  let characters = 0;
  let startOffset, endOffset;
  for (let lineNumber = 1; lineNumber <= lines.length; lineNumber++) {
    const line = lines[lineNumber - 1];
    if (range.start.line === lineNumber) {
      startOffset = characters + range.start.character;
    }
    if (range.end.line === lineNumber) {
      endOffset = characters + range.end.character;
    }
    characters += line.length + 1; // include newline
  }
  if (startOffset === undefined || endOffset === undefined) {
    return null;
  }
  return str.slice(0, startOffset) + newText + str.slice(endOffset, str.length);
}

/**
 * Constrain selection to intersection with range. Returns new selection; does not modify parameters.
 * If the ranges do not intersect, return null.
 */
export function intersect(selection: Selection, range: Range): Selection | null {
  if (
    (isBefore(selection.anchor, range.start) && isBefore(selection.active, range.start)) ||
    (isAfter(selection.anchor, range.end) && isAfter(selection.active, range.end))
  ) {
    return null;
  }
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

function isAfter(p1: Position, p2: Position) {
  return compare(p1, p2) === 1;
}

function isBefore(p1: Position, p2: Position) {
  return compare(p1, p2) === -1;
}
