import { PaintStyle, Skia, StrokeCap } from '@shopify/react-native-skia';
import type { SkCanvas } from '@shopify/react-native-skia';
import type { JointName, LandmarkPoint } from '../../types/pose.types';

const JOINT_INDICES: Record<JointName, number> = {
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

const JOINTS = Object.keys(JOINT_INDICES) as JointName[];
const BONE_CONNECTIONS: readonly (readonly [JointName, JointName])[] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

const MIN_VISIBILITY = 0.3;

export function drawSkeletonOverlay(
  canvas: SkCanvas,
  landmarks: readonly LandmarkPoint[],
  frameWidth: number,
  frameHeight: number,
): void {
  'worklet';

  const bonePaint = Skia.Paint();
  bonePaint.setColor(Skia.Color('#C4F278'));
  bonePaint.setStyle(PaintStyle.Stroke);
  bonePaint.setStrokeCap(StrokeCap.Round);
  bonePaint.setStrokeWidth(Math.max(frameWidth * 0.009, 5));

  for (const [fromJoint, toJoint] of BONE_CONNECTIONS) {
    const from = landmarks[JOINT_INDICES[fromJoint]];
    const to = landmarks[JOINT_INDICES[toJoint]];
    if (!from || !to || from.visibility < MIN_VISIBILITY || to.visibility < MIN_VISIBILITY) {
      continue;
    }

    canvas.drawLine(
      from.x * frameWidth,
      from.y * frameHeight,
      to.x * frameWidth,
      to.y * frameHeight,
      bonePaint,
    );
  }

  const visibleJointPaint = Skia.Paint();
  visibleJointPaint.setColor(Skia.Color('#C4F278'));
  const uncertainJointPaint = Skia.Paint();
  uncertainJointPaint.setColor(Skia.Color('#FFB875'));
  const jointRadius = Math.max(frameWidth * 0.017, 8);

  for (const joint of JOINTS) {
    const point = landmarks[JOINT_INDICES[joint]];
    if (!point || point.visibility < MIN_VISIBILITY) continue;

    canvas.drawCircle(
      point.x * frameWidth,
      point.y * frameHeight,
      jointRadius,
      point.visibility >= 0.65 ? visibleJointPaint : uncertainJointPaint,
    );
  }
}
