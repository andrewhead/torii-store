import { AnyAction } from "redux";
import { LineId, LineVersionId } from "../lines/types";
import * as names from "./action-names";

export interface Step {
  linesAdded: LineVersionId[];
  linesRemoved: LineVersionId[];
}

export type StepId = string;

export type AllSteps = StepId[];
export interface StepsById {
  [stepId: string]: Step;
}
export interface Steps {
  byId: StepsById;
  allSteps: AllSteps;
}

export interface CreateStepAction {
  type: typeof names.CREATE_STEP;
  id: string;
  index: number;
}

export interface AddLineToStepAction {
  type: typeof names.ADD_LINE_TO_STEP;
  lineVersionId: LineVersionId;
  stepId: StepId;
}

export interface PatchLineAction {
  type: typeof names.PATCH_LINE;
  lineId: LineId;
  stepId: StepId;
}

export type StepActionTypes = CreateStepAction | AddLineToStepAction | PatchLineAction;

export function isStepAction(action: AnyAction): action is StepActionTypes {
  return (action as StepActionTypes).type !== undefined;
}
