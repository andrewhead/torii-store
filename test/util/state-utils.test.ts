import { deferrable } from "../../src/util/state-utils";

describe("deferrable", () => {
  it("executes when not deferred", done => {
    const callback = () => {
      done();
    };
    const wrapped = deferrable(callback);
    wrapped();
  });

  it("defers execution", done => {
    const SHORT_DELAY = 1;
    const callback = (msg: string) => {
      expect(msg).toEqual("last while deferred");
      done();
    };
    const wrapped = deferrable(callback);
    wrapped.defer(SHORT_DELAY);
    wrapped("skip");
    wrapped("skip");
    wrapped("last while deferred");
  });
});
