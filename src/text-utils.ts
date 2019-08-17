export const NEWLINE = /\n/;

export function toLines(text: string) {
  return text.split(NEWLINE);
}

export function join(...lines: string[]) {
  return lines.join("\n");
}
