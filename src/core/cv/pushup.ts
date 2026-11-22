import type { ExerciseRepState } from '../../types/pose.types';
import { jointAngle2D } from './angleMath';
import type { LandmarkInput } from './angleMath';
import { copyState, setStatuses, visiblePoint } from './exerciseUtils';

export function evaluatePushup(
  landmarks: LandmarkInput,
  previous?: ExerciseRepState,
): ExerciseRepState {
  const state = copyState(previous, previous?.phase ?? 'up');
  const left = jointAngle2D(landmarks, 'left_shoulder', 'left_elbow', 'left_wrist');
  const right = jointAngle2D(landmarks, 'right_shoulder', 'right_elbow', 'right_wrist');
  const elbow = left !== undefined && right !== undefined ? (left + right) / 2 : left ?? right ?? 180;

  const leftShoulder = visiblePoint(landmarks, 'left_shoulder');
  const rightShoulder = visiblePoint(landmarks, 'right_shoulder');
  const leftHip = visiblePoint(landmarks, 'left_hip');
  const rightHip = visiblePoint(landmarks, 'right_hip');
  const leftKnee = visiblePoint(landmarks, 'left_knee');
  const rightKnee = visiblePoint(landmarks, 'right_knee');
  const leftLine = Boolean(leftShoulder && leftHip && leftKnee &&
    Math.abs(2 * leftHip.y - leftShoulder.y - leftKnee.y) > 0.30);
  const rightLine = Boolean(rightShoulder && rightHip && rightKnee &&
    Math.abs(2 * rightHip.y - rightShoulder.y - rightKnee.y) > 0.30);
  const lineError = leftLine || rightLine;
  const formGood = elbow >= 75 && elbow <= 160 && !lineError;

  if (elbow < 105) state.phase = 'down';
  if (elbow > 155 && state.phase === 'down') {
    state.phase = 'up';
    state.repCount += 1;
  }

  setStatuses(state, ['left_elbow', 'right_elbow', 'left_shoulder', 'right_shoulder'], formGood ? 'ok' : 'error');
  if (lineError) state.activeErrorCode = 'BODY_LINE';
  else if (elbow < 75) state.activeErrorCode = 'ELBOW_TOO_BENT';
  else if (elbow > 160) state.activeErrorCode = 'NOT_ENOUGH_DEPTH';
  state.accuracyScore = Math.max(0, Math.min(100, lineError ? 60 : Math.round(formGood ? 95 : 70)));
  return state;
}

export class PushupEvaluator {
  evaluate(landmarks: LandmarkInput, previous?: ExerciseRepState): ExerciseRepState {
    return evaluatePushup(landmarks, previous);
  }
}
