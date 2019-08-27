/**
 * This definition is in all likelihood incomplete. It was fleshed out only to the extent that it
 * could be useful for type-checking in this package.
 */
declare module "deep-diff" {
  function diff(lhs: any, rhs: any): undefined | Diff[];
  export = diff;
}

declare interface Diff {
  kind: string;
  path: DiffPath;
}

declare interface DeleteDiff extends Diff {
  kind: "D";
  lhs: any;
}

declare interface AddDiff extends Diff {
  kind: "N";
  rhs: any;
}

declare interface EditDiff extends Diff {
  kind: "E";
  lhs: any;
  rhs: any;
}

declare interface ArrayDiff extends Diff {
  kind: "A";
  index: number;
  item: DeleteDiff | AddDiff | EditDiff;
}

declare type DiffPath = (string | number)[];
