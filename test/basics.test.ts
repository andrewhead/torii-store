import { example } from "../src";


describe("basics", () => {
  it("runs without error", () => {
    expect(example).toEqual({ property1: "hi", property2: "bye" });
  });
});