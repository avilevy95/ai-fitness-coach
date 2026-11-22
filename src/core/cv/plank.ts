import type { ExerciseRepState } from '../../types/pose.types';
import { jointAngle2D } from './angleMath';
import type { LandmarkInput } from './angleMath';
import { copyState, setStatuses } from './exerciseUtils';

export function evaluatePlank(
  landmarks: LandmarkInput,
  previous?: ExerciseRepState,
  elapsedSeconds = 1,
): ExerciseRepState {
  const state = copyState(previous, 'hold');
  const shoulderHip = jointAngle2D(landmarks, 'left_shoulder', 'left_hip', 'left_knee');
  const right = jointAngle2D(landmarks, 'right_shoulder', 'right_hip', 'right_knee');
  const lineAngle = shoulderHip !== undefined && right !== undefined
    ? (shoulderHip + right) / 2
    : shoulderHip ?? right ?? 180;
  const formGood = lineAngle >= 150;

  state.holdSeconds = formGood
    ? Math.max(0, state.holdSeconds) + Math.max(0, elapsedSeconds)
    : 0;
  setStatuses(state,
    ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'],
    formGood ? 'ok' : 'error');
  state.activeErrorCode = formGood ? null : 'BODY_LINE';
  state.accuracyScore = formGood ? Math.round(Math.min(100, 80 + lineAngle * 0.11)) : 55;
  return state;
}

export class PlankEvaluator {
  evaluate(landmarks: LandmarkInput, previous?: ExerciseRepState, elapsedSeconds = 1): ExerciseRepState {
    return evaluatePlank(landmarks, previous, elapsedSeconds);
  }
}
