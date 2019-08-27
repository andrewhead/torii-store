export type PathElementPattern = string | number | RegExp | undefined;

export function isAddDiff(diff: Diff): diff is AddDiff {
  return diff.kind === "N";
}

export function isDeleteDiff(diff: Diff): diff is DeleteDiff {
  return diff.kind === "D";
}

export function isEditDiff(diff: Diff): diff is EditDiff {
  return diff.kind === "E";
}

export function isArrayDiff(diff: Diff): diff is ArrayDiff {
  return diff.kind === "A";
}

/**
 * Contents of all files in a snapshot of a program. The key in this dictionary is a path to the
 * file from the refernce implementation, and the value is the contents of that file in this
 * snapshot of the program.
 */
export interface FileContents {
  [filePath: string]: string;
}
