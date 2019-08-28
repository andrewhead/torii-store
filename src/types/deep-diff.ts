/**
 * This definition is in all likelihood incomplete. It was fleshed out only to the extent that it
 * could be useful for type-checking in this package.
 */
declare module "deep-diff" {
  export function diff(lhs: any, rhs: any): undefined | Diff[];

  export interface Diff {
    kind: string;
    path: DiffPath;
  }

  export interface DeleteDiff extends Diff {
    kind: "D";
    lhs: any;
  }

  export interface AddDiff extends Diff {
    kind: "N";
    rhs: any;
  }

  export interface EditDiff extends Diff {
    kind: "E";
    lhs: any;
    rhs: any;
  }

  export interface ArrayDiff extends Diff {
    kind: "A";
    index: number;
    item: DeleteDiff | AddDiff | EditDiff;
  }
}

declare type DiffPath = (string | number)[];
