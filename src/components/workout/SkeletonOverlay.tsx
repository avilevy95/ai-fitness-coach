import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Line } from '@shopify/react-native-skia';
import type {
  BoneConnection,
  JointName,
  JointStatus,
  LandmarkPoint,
} from '../../types/pose.types';

export const BONE_CONNECTIONS: readonly BoneConnection[] = [
  { from: 'left_shoulder', to: 'right_shoulder' },
  { from: 'left_shoulder', to: 'left_elbow' },
  { from: 'left_elbow', to: 'left_wrist' },
  { from: 'right_shoulder', to: 'right_elbow' },
  { from: 'right_elbow', to: 'right_wrist' },
  { from: 'left_shoulder', to: 'left_hip' },
  { from: 'right_shoulder', to: 'right_hip' },
  { from: 'left_hip', to: 'right_hip' },
  { from: 'left_hip', to: 'left_knee' },
  { from: 'left_knee', to: 'left_ankle' },
  { from: 'right_hip', to: 'right_knee' },
  { from: 'right_knee', to: 'right_ankle' },
];

export type SkeletonLandmarks =
  | Partial<Record<JointName, LandmarkPoint>>
  | readonly LandmarkPoint[];

export type SkeletonOverlayProps = {
  landmarks?: SkeletonLandmarks | null;
  jointStatuses?: Partial<Record<JointName, JointStatus>>;
  width?: number;
  height?: number;
};

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

function getPoint(
  landmarks: SkeletonLandmarks,
  joint: JointName,
): LandmarkPoint | undefined {
  if (Array.isArray(landmarks)) {
    return landmarks[JOINT_INDICES[joint]];
  }
  return (landmarks as Partial<Record<JointName, LandmarkPoint>>)[joint];
}

export function SkeletonOverlay({
  landmarks,
  jointStatuses,
  width,
  height,
}: SkeletonOverlayProps): React.ReactElement {
  const [size, setSize] = React.useState({ width: width ?? 0, height: height ?? 0 });

  React.useEffect(() => {
    if (width !== undefined && height !== undefined) setSize({ width, height });
  }, [width, height]);

  const scalePoint = (point: LandmarkPoint): [number, number] => {
    const isNormalized = point.x <= 1 && point.y <= 1;
    return [
      isNormalized ? point.x * size.width : point.x,
      isNormalized ? point.y * size.height : point.y,
    ];
  };

  const joints: readonly JointName[] = [
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

  return (
    <View
      style={[
        styles.overlay,
        width !== undefined ? { width } : null,
        height !== undefined ? { height } : null,
      ]}
      onLayout={(event) => {
        if (width === undefined || height === undefined) {
          setSize({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          });
        }
      }}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        {landmarks
          ? BONE_CONNECTIONS.map((connection) => {
              const from = getPoint(landmarks, connection.from);
              const to = getPoint(landmarks, connection.to);
              if (!from || !to) return null;
              const [x1, y1] = scalePoint(from);
              const [x2, y2] = scalePoint(to);
              const status = jointStatuses?.[connection.from]
                ?? jointStatuses?.[connection.to]
                ?? 'neutral';
              const color = status === 'ok' ? '#34C759' : status === 'error' ? '#FF3B30' : '#FFD60A';
              return (
                <Line
                  key={`${connection.from}-${connection.to}`}
                  p1={{ x: x1, y: y1 }}
                  p2={{ x: x2, y: y2 }}
                  color={color}
                  strokeWidth={5}
                />
              );
            })
          : null}
        {landmarks
          ? joints.map((joint) => {
              const point = getPoint(landmarks, joint);
              if (!point) return null;
              const [x, y] = scalePoint(point);
              const status = jointStatuses?.[joint] ?? 'neutral';
              const color = status === 'ok' ? '#34C759' : status === 'error' ? '#FF3B30' : '#FFD60A';
              return (
                <Circle key={joint} cx={x} cy={y} r={7} color={color} />
              );
            })
          : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});

export default SkeletonOverlay;
