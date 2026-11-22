/// <reference types="jest" />

import type { JointName, LandmarkPoint } from '../../src/types/pose.types';
import { angle2D, euclideanDistance2D, ema } from '../../src/core/cv/angleMath';
import { calibrationGuidance } from '../../src/core/cv/calibration';
import { evaluateSquat } from '../../src/core/cv/squat';
import { evaluatePushup } from '../../src/core/cv/pushup';
import { evaluatePlank } from '../../src/core/cv/plank';
import { evaluateLunge } from '../../src/core/cv/lunge';
import { evaluateCrunch } from '../../src/core/cv/crunch';
import { evaluateJumpingJack } from '../../src/core/cv/jumpingJack';

function point(x: number, y: number, visibility = 1): LandmarkPoint {
  return { x, y, z: 0, visibility };
}

function landmarks(): Record<JointName, LandmarkPoint> {
  const map = {} as Record<JointName, LandmarkPoint>;
  const names: JointName[] = [
    'nose', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee',
    'right_knee', 'left_ankle', 'right_ankle',
  ];
  names.forEach((name) => { map[name] = point(0.5, 0.5); });
  map.nose = point(0.5, 0.12);
  map.left_shoulder = point(0.36, 0.28);
  map.right_shoulder = point(0.64, 0.28);
  map.left_elbow = point(0.30, 0.46);
  map.right_elbow = point(0.70, 0.46);
  map.left_wrist = point(0.30, 0.62);
  map.right_wrist = point(0.70, 0.62);
  map.left_hip = point(0.40, 0.62);
  map.right_hip = point(0.60, 0.62);
  map.left_knee = point(0.38, 0.78);
  map.right_knee = point(0.62, 0.78);
  map.left_ankle = point(0.38, 0.92);
  map.right_ankle = point(0.62, 0.92);
  return map;
}

describe('CV angle math', () => {
  test('computes 2D right angle and distance', () => {
    expect(angle2D(point(0, 1), point(0, 0), point(1, 0))).toBeCloseTo(90, 5);
    expect(euclideanDistance2D(point(0, 0), point(3, 4))).toBe(5);
  });

  test('EMA smooths toward the current value', () => {
    expect(ema(100, 0, 0.5)).toBe(50);
  });
});

describe('calibration', () => {
  test('accepts a fully visible body', () => {
    expect(calibrationGuidance(landmarks()).isValid).toBe(true);
  });

  test('gives Hebrew guidance for hidden or out-of-bounds joints', () => {
    const bad = landmarks();
    bad.left_ankle.visibility = 0.1;
    bad.right_wrist = point(1.2, 0.5);
    const result = calibrationGuidance(bad);
    expect(result.isValid).toBe(false);
    expect(result.guidanceHe.join('')).toMatch(/גוף|מסך/);
  });
});

describe('exercise state machines', () => {
  test('squat accepts a bent knee bottom position', () => {
    const map = landmarks();
    map.left_knee = point(0.55, 0.78);
    map.right_knee = point(0.45, 0.78);
    map.left_ankle = point(0.40, 0.92);
    map.right_ankle = point(0.60, 0.92);
    const result = evaluateSquat(map);
    expect(result.jointStatuses.left_knee).toBe('ok');
  });

  test('squat marks a straight faulty knee', () => {
    const map = landmarks();
    map.left_knee = point(0.38, 0.78);
    map.right_knee = point(0.62, 0.78);
    const result = evaluateSquat(map);
    expect(result.jointStatuses.left_knee).toBe('error');
  });

  test('pushup marks a valid deep elbow and faulty body line', () => {
    const map = landmarks();
    map.left_elbow = point(0.36, 0.56);
    map.right_elbow = point(0.64, 0.56);
    map.left_wrist = point(0.60, 0.56);
    map.right_wrist = point(0.40, 0.56);
    expect(evaluatePushup(map).jointStatuses.left_elbow).toBe('ok');

    map.right_hip = point(0.60, 0.10);
    expect(evaluatePushup(map).activeErrorCode).toBe('BODY_LINE');
  });

  test('plank holds with a straight body and resets faulty form', () => {
    const map = landmarks();
    map.left_knee = point(0.38, 0.92);
    map.right_knee = point(0.62, 0.92);
    expect(evaluatePlank(map, undefined, 1).holdSeconds).toBe(1);
    map.left_knee = point(0.38, 0.20);
    expect(evaluatePlank(map).activeErrorCode).toBe('BODY_LINE');
  });

  test('lunge evaluates front knee angle', () => {
    const map = landmarks();
    map.left_knee = point(0.38, 0.68);
    map.left_ankle = point(0.38, 0.92);
    expect(evaluateLunge(map).jointStatuses.left_knee).toBe('ok');
  });

  test('crunch detects lifted shoulders and faulty relaxed form', () => {
    const map = landmarks();
    map.left_shoulder = point(0.36, 0.48);
    map.right_shoulder = point(0.64, 0.48);
    expect(evaluateCrunch(map).activeErrorCode).not.toBe('SHOULDERS_NOT_LIFTED');
    map.left_shoulder = point(0.36, 0.68);
    map.right_shoulder = point(0.64, 0.68);
    expect(evaluateCrunch(map).activeErrorCode).toBe('SHOULDERS_NOT_LIFTED');
  });

  test('jumping jack counts an open frame as open', () => {
    const map = landmarks();
    map.left_wrist = point(0.05, 0.05);
    map.right_wrist = point(0.95, 0.05);
    map.left_ankle = point(0.10, 0.92);
    map.right_ankle = point(0.90, 0.92);
    expect(evaluateJumpingJack(map).phase).toBe('open');
  });
});
