import type { ExerciseRepState } from '../../types/pose.types';
import { jointAngle2D } from './angleMath';
import type { LandmarkInput } from './angleMath';
import { copyState, setStatuses } from './exerciseUtils';

export function evaluateLunge(
  landmarks: LandmarkInput,
  previous?: ExerciseRepState,
): ExerciseRepState {
  const state = copyState(previous, previous?.phase ?? 'standing');
  const left = jointAngle2D(landmarks, 'left_hip', 'left_knee', 'left_ankle');
  const right = jointAngle2D(landmarks, 'right_hip', 'right_knee', 'right_ankle');
  const front = left !== undefined && right !== undefined
    ? Math.min(left, right)
    : left ?? right ?? 180;
  const formGood = front >= 45 && front <= 165;

  if (front < 125) state.phase = 'down';
  if (front > 155 && state.phase === 'down') {
    state.phase = 'standing';
    state.repCount += 1;
  }

  setStatuses(state,
    ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    formGood ? 'ok' : 'error');
  state.activeErrorCode = formGood
    ? null
    : front < 75 ? 'KNEE_TOO_FAR_FORWARD' : 'LUNGE_NOT_DEEP';
  state.accuracyScore = Math.max(0, Math.min(100, formGood ? Math.round(100 - Math.abs(90 - front) * 0.3) : 55));
  return state;
}

export class LungeEvaluator {
  evaluate(landmarks: LandmarkInput, previous?: ExerciseRepState): ExerciseRepState {
    return evaluateLunge(landmarks, previous);
  }
}
