import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import type { Frame } from 'react-native-vision-camera';
import type { ExercisePrescription } from '../../types/workout.types';
import type { ExerciseRepState, LandmarkPoint, JointName } from '../../types/pose.types';
import SkeletonOverlay from './SkeletonOverlay';

export type SplitWorkoutScreenProps = {
  exercise: ExercisePrescription;
  repState?: ExerciseRepState;
  landmarks?: Partial<Record<JointName, LandmarkPoint>> | readonly LandmarkPoint[] | null;
  paused?: boolean;
  onPause?: () => void;
  onSkip?: () => void;
  onFrame?: (frame: Frame) => void;
};

function useSkiaFrameProcessor(frameCallback?: (frame: Frame) => void) {
  return useFrameOutput({
    pixelFormat: 'yuv',
    dropFramesWhileBusy: true,
    onFrame(frame) {
      'worklet';
      frameCallback?.(frame);
    },
  });
}

export function SplitWorkoutScreen({
  exercise,
  repState,
  landmarks,
  paused = false,
  onPause,
  onSkip,
  onFrame,
}: SplitWorkoutScreenProps): React.ReactElement {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const frameOutput = useSkiaFrameProcessor(onFrame);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const requestCamera = useCallback(async () => {
    setPermissionRequested(true);
    await requestPermission();
  }, [requestPermission]);

  const statusText = useMemo(() => {
    if (paused) return 'המשחק מושהה';
    if (repState?.activeErrorCode) return repState.activeErrorCode;
    return exercise.hebrewName;
  }, [exercise.hebrewName, paused, repState?.activeErrorCode]);

  const cameraUnavailable =
    !hasPermission || !device || permissionRequested && !hasPermission;

  return (
    <View style={styles.screen}>
      <View style={styles.videoSlot}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoText}>{statusText}</Text>
          {exercise.instructionsHe ? (
            <Text style={styles.instructions}>{exercise.instructionsHe}</Text>
          ) : null}
        </View>
        {onPause || onSkip ? (
          <View style={styles.controls}>
            {onPause ? (
              <Pressable onPress={onPause} style={styles.controlButton}>
                <Text style={styles.controlText}>{paused ? 'המשך' : 'השהה'}</Text>
              </Pressable>
            ) : null}
            {onSkip ? (
              <Pressable onPress={onSkip} style={styles.controlButton}>
                <Text style={styles.controlText}>דלג</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.cameraSlot}>
        {cameraUnavailable ? (
          <Pressable style={styles.noCamera} onPress={hasPermission ? undefined : requestCamera}>
            <Text style={styles.noCameraTitle}>מצלמה אינה זמינה</Text>
            <Text style={styles.noCameraText}>
              {!hasPermission ? 'הענק הרשאת מצלמה כדי להפעיל מעקב' : 'בדוק את מצלמת המכשיר'}
            </Text>
            {!hasPermission ? <Text style={styles.requestText}>הפעלת מצלמה</Text> : null}
          </Pressable>
        ) : (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={!paused}
            resizeMode="cover"
            outputs={[frameOutput]}
          />
        )}
        {landmarks ? (
          <SkeletonOverlay
            landmarks={landmarks}
            jointStatuses={repState?.jointStatuses}
          />
        ) : null}
        {repState ? (
          <View style={styles.repHud}>
            <Text style={styles.repText}>חזרות: {repState.repCount}</Text>
            <Text style={styles.repText}>דיוק: {Math.round(repState.accuracyScore)}%</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#090909' },
  videoSlot: { height: '42%', width: '100%', backgroundColor: '#111111' },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  videoText: { color: '#ffffff', fontSize: 22, fontWeight: '700', writingDirection: 'rtl' },
  instructions: { color: '#dddddd', marginTop: 8, textAlign: 'center', writingDirection: 'rtl' },
  controls: {
    position: 'absolute',
    top: 12,
    start: 12,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  controlText: { color: '#ffffff', fontSize: 14, writingDirection: 'rtl' },
  cameraSlot: { height: '58%', width: '100%', backgroundColor: '#050505', overflow: 'hidden' },
  noCamera: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202020',
  },
  noCameraTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', writingDirection: 'rtl' },
  noCameraText: { color: '#bbbbbb', marginTop: 8, writingDirection: 'rtl' },
  requestText: { color: '#62A0FF', marginTop: 12, writingDirection: 'rtl' },
  repHud: {
    position: 'absolute',
    end: 12,
    bottom: 12,
    direction: 'rtl',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  repText: { color: '#ffffff', writingDirection: 'rtl' },
});

export default SplitWorkoutScreen;
