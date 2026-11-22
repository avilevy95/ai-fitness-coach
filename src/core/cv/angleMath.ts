import type { JointName, LandmarkPoint } from '../../types/pose.types';

export type LandmarkInput =
  | Partial<Record<JointName, LandmarkPoint>>
  | readonly LandmarkPoint[];

export const JOINT_INDICES: Record<JointName, number> = {
  nose: 0,
  left_shoulder: 11,
  right_shoulder: 12,
  left_elbow: 13,
  right_elbow: 14,
  left_wrist: 15,
  right_wrist: 16,
  left_hip: 23,
  right_hip: 24,
  left_knee: 25,
  right_knee: 26,
  left_ankle: 27,
  right_ankle: 28,
};

export function getLandmark(
  landmarks: LandmarkInput,
  joint: JointName,
): LandmarkPoint | undefined {
  if (Array.isArray(landmarks)) {
    return (landmarks as readonly LandmarkPoint[])[JOINT_INDICES[joint]];
  }
  return (landmarks as Partial<Record<JointName, LandmarkPoint>>)[joint];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function euclideanDistance2D(
  a: Pick<LandmarkPoint, 'x' | 'y'>,
  b: Pick<LandmarkPoint, 'x' | 'y'>,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function euclideanDistance3D(
  a: Pick<LandmarkPoint, 'x' | 'y' | 'z'>,
  b: Pick<LandmarkPoint, 'x' | 'y' | 'z'>,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export const euclideanDistance = euclideanDistance3D;
export const distance2D = euclideanDistance2D;
export const distance3D = euclideanDistance3D;

export function angle2D(
  first: Pick<LandmarkPoint, 'x' | 'y'>,
  vertex: Pick<LandmarkPoint, 'x' | 'y'>,
  third: Pick<LandmarkPoint, 'x' | 'y'>,
): number {
  const ax = first.x - vertex.x;
  const ay = first.y - vertex.y;
  const bx = third.x - vertex.x;
  const by = third.y - vertex.y;
  const dot = ax * bx + ay * by;
  const denom = Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by);
  if (denom === 0) return 0;
  return (Math.acos(clamp(dot / denom, -1, 1)) * 180) / Math.PI;
}

export function angle3D(
  first: Pick<LandmarkPoint, 'x' | 'y' | 'z'>,
  vertex: Pick<LandmarkPoint, 'x' | 'y' | 'z'>,
  third: Pick<LandmarkPoint, 'x' | 'y' | 'z'>,
): number {
  const ax = first.x - vertex.x;
  const ay = first.y - vertex.y;
  const az = first.z - vertex.z;
  const bx = third.x - vertex.x;
  const by = third.y - vertex.y;
  const bz = third.z - vertex.z;
  const dot = ax * bx + ay * by + az * bz;
  const denom =
    Math.sqrt(ax * ax + ay * ay + az * az) *
    Math.sqrt(bx * bx + by * by + bz * bz);
  if (denom === 0) return 0;
  return (Math.acos(clamp(dot / denom, -1, 1)) * 180) / Math.PI;
}

export function jointAngle2D(
  landmarks: LandmarkInput,
  first: JointName,
  vertex: JointName,
  third: JointName,
): number | undefined {
  const a = getLandmark(landmarks, first);
  const b = getLandmark(landmarks, vertex);
  const c = getLandmark(landmarks, third);
  return a && b && c ? angle2D(a, b, c) : undefined;
}

export function jointAngle3D(
  landmarks: LandmarkInput,
  first: JointName,
  vertex: JointName,
  third: JointName,
): number | undefined {
  const a = getLandmark(landmarks, first);
  const b = getLandmark(landmarks, vertex);
  const c = getLandmark(landmarks, third);
  return a && b && c ? angle3D(a, b, c) : undefined;
}

export function ema(previous: number, current: number, alpha = 0.35): number {
  const safeAlpha = clamp(alpha, 0, 1);
  return safeAlpha * current + (1 - safeAlpha) * previous;
}

export const smoothEMA = ema;

