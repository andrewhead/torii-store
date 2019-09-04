import _ from "lodash";
import { DeepPartial } from "redux";
import { createStore } from "..";
import { State } from "../state/types";

export function createState(partialState?: DeepPartial<State>): State {
  const emptyState = createStore().getState();
  return _.merge({}, emptyState, partialState);
}

/**
 * Create an callback whose processing can be deferred. See 'Deferrable' interface for more details.
 */
export function deferrable(callback: (...args: any) => void): Deferrable {
  let deferredArgs;
  let callbackDeferred = false;
  let timeout;
  function defer(wait) {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      if (callbackDeferred === true) {
        callback(...deferredArgs);
        callbackDeferred = false;
        deferredArgs = undefined;
        timeout = undefined;
      }
    }, wait);
  }

  const wrapped = <Deferrable>function(...args: any[]) {
    if (timeout !== undefined) {
      deferredArgs = args;
      callbackDeferred = true;
    } else {
      callback(...args);
    }
  };
  wrapped.defer = defer;
  return wrapped;
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
