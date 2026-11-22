import type { ExerciseRepState } from '../../types/pose.types';
import { jointAngle2D, jointAngle3D } from './angleMath';
import type { LandmarkInput } from './angleMath';
import { copyState, setStatuses, visiblePoint } from './exerciseUtils';

export function evaluateSquat(
  landmarks: LandmarkInput,
  previous?: ExerciseRepState,
): ExerciseRepState {
  const state = copyState(previous, previous?.phase ?? 'standing');
  state.jointStatuses = {
    ...state.jointStatuses,
  };
  setStatuses(state, ['left_knee', 'right_knee', 'left_hip', 'right_hip'], 'neutral');

  const lk = jointAngle2D(landmarks, 'left_hip', 'left_knee', 'left_ankle');
  const rk = jointAngle2D(landmarks, 'right_hip', 'right_knee', 'right_ankle');
  const lKnee3d = jointAngle3D(landmarks, 'left_hip', 'left_knee', 'left_ankle');
  const rKnee3d = jointAngle3D(landmarks, 'right_hip', 'right_knee', 'right_ankle');
  const knee = lk !== undefined && rk !== undefined
    ? (lk + rk) / 2
    : lk ?? rk ?? lKnee3d ?? rKnee3d ?? 180;

  const leftHip = visiblePoint(landmarks, 'left_hip');
  const rightHip = visiblePoint(landmarks, 'right_hip');
  const leftKnee = visiblePoint(landmarks, 'left_knee');
  const rightKnee = visiblePoint(landmarks, 'right_knee');

  let formGood = knee >= 65 && knee <= 140;
  if (leftHip && leftKnee && rightHip && rightKnee) {
    const hipY = (leftHip.y + rightHip.y) / 2;
    const kneeY = (leftKnee.y + rightKnee.y) / 2;
    formGood = formGood && hipY > kneeY - 0.04;
  }

  if (knee < 135 && state.phase === 'standing') state.phase = 'descending';
  if (knee <= 115) state.phase = 'bottom';
  if (knee > 155 && state.phase === 'bottom') {
    state.phase = 'standing';
    state.repCount += 1;
  }

  const leftKneeGood = lk !== undefined ? lk >= 65 && lk <= 140 : true;
  const rightKneeGood = rk !== undefined ? rk >= 65 && rk <= 140 : true;
  state.jointStatuses.left_knee = leftKneeGood ? 'ok' : 'error';
  state.jointStatuses.right_knee = rightKneeGood ? 'ok' : 'error';
  setStatuses(state, ['left_hip', 'right_hip'], formGood ? 'ok' : 'error');
  if (!formGood) state.activeErrorCode = knee < 65 ? 'KNEE_TOO_DEEP' : 'SQUAT_NOT_DEEP';
  state.accuracyScore = Math.max(0, Math.min(100, Math.round(formGood
    ? 100 - Math.abs(90 - knee) * 0.25
    : 55)));
  return state;
}

export class SquatEvaluator {
  evaluate(landmarks: LandmarkInput, previous?: ExerciseRepState): ExerciseRepState {
    return evaluateSquat(landmarks, previous);
  }
}

