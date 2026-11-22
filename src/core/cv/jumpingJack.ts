import type { ExerciseRepState } from '../../types/pose.types';
import { euclideanDistance2D, jointAngle2D } from './angleMath';
import type { LandmarkInput } from './angleMath';
import { copyState, setStatuses, visiblePoint } from './exerciseUtils';

export function evaluateJumpingJack(
  landmarks: LandmarkInput,
  previous?: ExerciseRepState,
): ExerciseRepState {
  const state = copyState(previous, previous?.phase ?? 'closed');
  const leftWrist = visiblePoint(landmarks, 'left_wrist');
  const rightWrist = visiblePoint(landmarks, 'right_wrist');
  const leftShoulder = visiblePoint(landmarks, 'left_shoulder');
  const rightShoulder = visiblePoint(landmarks, 'right_shoulder');
  const leftAnkle = visiblePoint(landmarks, 'left_ankle');
  const rightAnkle = visiblePoint(landmarks, 'right_ankle');

  const handsUp = Boolean(leftWrist && rightWrist && leftShoulder && rightShoulder &&
    leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y);
  const feetApart = Boolean(leftAnkle && rightAnkle &&
    euclideanDistance2D(leftAnkle, rightAnkle) > 0.28);
  const open = handsUp && feetApart;

  const leftArm = jointAngle2D(landmarks, 'left_hip', 'left_shoulder', 'left_wrist');
  const rightArm = jointAngle2D(landmarks, 'right_hip', 'right_shoulder', 'right_wrist');
  const formGood = open;

  if (open) state.phase = 'open';
  if (!open && state.phase === 'open') {
    state.phase = 'closed';
    state.repCount += 1;
  }

  setStatuses(state,
    ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist',
      'left_ankle', 'right_ankle'],
    formGood ? 'ok' : 'error');
  state.activeErrorCode = formGood ? null : 'ARMS_OR_FEET_NOT_EXTENDED';
  state.accuracyScore = formGood ? 100 : 55;
  if (leftArm !== undefined && rightArm !== undefined) {
    state.accuracyScore = Math.round((state.accuracyScore + (leftArm + rightArm) / 2 * 0.2) / 2);
  }
  state.accuracyScore = Math.max(0, Math.min(100, state.accuracyScore));
  return state;
}

export class JumpingJackEvaluator {
  evaluate(landmarks: LandmarkInput, previous?: ExerciseRepState): ExerciseRepState {
    return evaluateJumpingJack(landmarks, previous);
  }
}
