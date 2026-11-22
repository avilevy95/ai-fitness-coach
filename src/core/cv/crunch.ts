import type { ExerciseRepState } from '../../types/pose.types';
import { jointAngle2D } from './angleMath';
import type { LandmarkInput } from './angleMath';
import { copyState, setStatuses, visiblePoint } from './exerciseUtils';

export function evaluateCrunch(
  landmarks: LandmarkInput,
  previous?: ExerciseRepState,
): ExerciseRepState {
  const state = copyState(previous, previous?.phase ?? 'down');
  const left = jointAngle2D(landmarks, 'left_shoulder', 'left_hip', 'left_knee');
  const right = jointAngle2D(landmarks, 'right_shoulder', 'right_hip', 'right_knee');
  const angle = left !== undefined && right !== undefined
    ? (left + right) / 2
    : left ?? right ?? 180;
  const shoulder = visiblePoint(landmarks, 'left_shoulder') ?? visiblePoint(landmarks, 'right_shoulder');
  const hip = visiblePoint(landmarks, 'left_hip') ?? visiblePoint(landmarks, 'right_hip');
  const lifted = Boolean(shoulder && hip && shoulder.y < hip.y - 0.08);
  const formGood = lifted && angle >= 35 && angle <= 100;

  if (lifted) state.phase = 'up';
  if (!lifted && state.phase === 'up') {
    state.phase = 'down';
    state.repCount += 1;
  }

  setStatuses(state,
    ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'],
    formGood ? 'ok' : 'error');
  state.activeErrorCode = !lifted ? 'SHOULDERS_NOT_LIFTED' : (angle < 35 ? 'CRUNCH_TOO_FAR' : null);
  state.accuracyScore = formGood ? Math.round(100 - Math.abs(70 - angle) * 0.35) : 50;
  return state;
}

export class CrunchEvaluator {
  evaluate(landmarks: LandmarkInput, previous?: ExerciseRepState): ExerciseRepState {
    return evaluateCrunch(landmarks, previous);
  }
}
