import type { ExerciseId } from '../../types/workout.types';
import type { ExerciseRepState } from '../../types/pose.types';
import type { LandmarkInput } from './angleMath';
import { calibrationGuidance } from './calibration';
import { evaluateSquat } from './squat';
import { evaluatePushup } from './pushup';
import { evaluatePlank } from './plank';
import { evaluateLunge } from './lunge';
import { evaluateCrunch } from './crunch';
import { evaluateJumpingJack } from './jumpingJack';

export type PoseEvaluationOptions = {
  elapsedSeconds?: number;
};

export function evaluatePose(
  exerciseId: ExerciseId,
  landmarks: LandmarkInput,
  state?: ExerciseRepState,
  options: PoseEvaluationOptions = {},
): ExerciseRepState {
  const calibration = calibrationGuidance(landmarks);
  if (!calibration.isValid) {
    const copy: ExerciseRepState = state
      ? { ...state, jointStatuses: { ...state.jointStatuses }, activeErrorCode: 'CALIBRATION' }
      : {
          phase: 'calibration',
          repCount: 0,
          holdSeconds: 0,
          jointStatuses: {
            nose: 'neutral',
            left_shoulder: 'neutral',
            right_shoulder: 'neutral',
            left_elbow: 'neutral',
            right_elbow: 'neutral',
            left_wrist: 'neutral',
            right_wrist: 'neutral',
            left_hip: 'neutral',
            right_hip: 'neutral',
            left_knee: 'neutral',
            right_knee: 'neutral',
            left_ankle: 'neutral',
            right_ankle: 'neutral',
          },
          accuracyScore: 0,
          activeErrorCode: 'CALIBRATION',
        };
    copy.accuracyScore = 0;
    return copy;
  }

  switch (exerciseId) {
    case 'squat':
      return evaluateSquat(landmarks, state);
    case 'pushup':
      return evaluatePushup(landmarks, state);
    case 'plank':
      return evaluatePlank(landmarks, state, options.elapsedSeconds ?? 1);
    case 'lunge':
      return evaluateLunge(landmarks, state);
    case 'crunch':
      return evaluateCrunch(landmarks, state);
    case 'jumping_jack':
      return evaluateJumpingJack(landmarks, state);
  }
}

export const evaluateExercise = evaluatePose;
export const poseEvaluator = evaluatePose;
export default evaluatePose;
