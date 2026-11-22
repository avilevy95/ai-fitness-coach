import type {
  ExerciseRepState,
  JointName,
  JointStatus,
  LandmarkPoint,
} from '../../types/pose.types';
import type { LandmarkInput } from './angleMath';
import { getLandmark } from './angleMath';

export const ALL_JOINTS: JointName[] = [
  'nose',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
];

export function neutralStatuses(): Record<JointName, JointStatus> {
  const statuses = {} as Record<JointName, JointStatus>;
  ALL_JOINTS.forEach((joint) => { statuses[joint] = 'neutral'; });
  return statuses;
}

export function copyState(
  previous: ExerciseRepState | undefined,
  phase: string,
): ExerciseRepState {
  return {
    phase,
    repCount: previous?.repCount ?? 0,
    holdSeconds: previous?.holdSeconds ?? 0,
    jointStatuses: previous ? { ...previous.jointStatuses } : neutralStatuses(),
    activeErrorCode: null,
    accuracyScore: previous?.accuracyScore ?? 100,
  };
}

export function setStatuses(
  state: ExerciseRepState,
  names: readonly JointName[],
  status: JointStatus,
): void {
  names.forEach((name) => { state.jointStatuses[name] = status; });
}

export function visiblePoint(
  landmarks: LandmarkInput,
  joint: JointName,
  threshold = 0.35,
): LandmarkPoint | undefined {
  const point = getLandmark(landmarks, joint);
  return point && point.visibility >= threshold ? point : undefined;
}

