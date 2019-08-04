import uuidv4 from "uuid/v4";
import { LineVersionId } from "../lines/types";
import * as names from "./action-names";
import { AddLineToStepAction, CreateStepAction, StepId } from "./types";

export function createStep(index: number): CreateStepAction {
  const id = uuidv4();
  return {
    id,
    index,
    type: names.CREATE_STEP
  };
}

export function addLine(stepId: StepId, lineVersionId: LineVersionId): AddLineToStepAction {
  return {
    lineVersionId,
    stepId,
    type: names.ADD_LINE_TO_STEP
  };
}
