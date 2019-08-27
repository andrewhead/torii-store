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

export interface Deferrable {
  /**
   * The callback. Should not return anything, as the results of calling the function would be
   * undefined if the function is deferred.
   */
  (...args: any): void;
  /**
   * Call 'defer' on the callback to defer it being called by 'wait' number of milliseconds. If
   * called while waiting, it resets the wait period to the time passed in. When the wait
   * has finished, the callback will be called once with the most recent version of the state.
   */
  defer: (wait: number) => void;
}
