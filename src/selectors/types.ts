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
