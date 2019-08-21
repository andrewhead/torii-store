import { replace } from "../../src/util/text-utils";

describe("replace", () => {
  it("replaces text", () => {
    const initial = "Line 1\n" + "Line 2";
    const range = { start: { line: 2, character: 0 }, end: { line: 2, character: 4 } };
    expect(replace(initial, range, "Ln")).toEqual("Line 1\n" + "Ln 2");
  });
});
