import type { JointName, LandmarkPoint } from '../../types/pose.types';
import { JOINT_INDICES, LandmarkInput } from './angleMath';

export interface CalibrationResult {
  isValid: boolean;
  visibleJoints: JointName[];
  outOfBoundsJoints: JointName[];
  guidanceHe: string[];
}

export function toLandmarkMap(
  landmarks: LandmarkInput,
): Partial<Record<JointName, LandmarkPoint>> {
  if (!Array.isArray(landmarks)) {
    return landmarks as Partial<Record<JointName, LandmarkPoint>>;
  }
  const result: Partial<Record<JointName, LandmarkPoint>> = {};
  (Object.keys(JOINT_INDICES) as JointName[]).forEach((joint) => {
    const point = landmarks[JOINT_INDICES[joint]];
    if (point) result[joint] = point;
  });
  return result;
}

export function calibrationGuidance(
  landmarks: LandmarkInput,
  visibilityThreshold = 0.5,
): CalibrationResult {
  const map = toLandmarkMap(landmarks);
  const visibleJoints: JointName[] = [];
  const outOfBoundsJoints: JointName[] = [];
  const guidanceHe: string[] = [];

  (Object.keys(map) as JointName[]).forEach((joint) => {
    const point = map[joint];
    if (!point) return;
    if (point.visibility >= visibilityThreshold) visibleJoints.push(joint);
    if (
      point.x < 0 ||
      point.x > 1 ||
      point.y < 0 ||
      point.y > 1
    ) outOfBoundsJoints.push(joint);
  });

  if (visibleJoints.length < 13) {
    guidanceHe.push('יש להציג את כל הגוף בתוך המצלמה');
  }
  if (outOfBoundsJoints.length > 0) {
    guidanceHe.push('עברו מעט אחורה כדי שהגוף כולו יהיה בגבולות המסך');
  }
  if (guidanceHe.length === 0) {
    guidanceHe.push('המיקום מצוין — אפשר להתחיל');
  }

  return {
    isValid: visibleJoints.length === 13 && outOfBoundsJoints.length === 0,
    visibleJoints,
    outOfBoundsJoints,
    guidanceHe,
  };
}
