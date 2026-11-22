export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export type JointName =
  | 'nose'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_wrist'
  | 'right_wrist'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_ankle'
  | 'right_ankle';

export type JointStatus = 'ok' | 'error' | 'neutral';

export interface BoneConnection {
  from: JointName;
  to: JointName;
}

export interface ExerciseRepState {
  phase: string;
  repCount: number;
  holdSeconds: number;
  jointStatuses: Record<JointName, JointStatus>;
  activeErrorCode: string | null;
  accuracyScore: number;
}
