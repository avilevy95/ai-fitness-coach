import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { SkiaCamera, type SkiaCameraProps } from 'react-native-vision-camera-skia';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { nitroPoseExercises } from 'react-native-nitro-pose-exercises';
import type { ExercisePrescription } from '../../types/workout.types';
import type { ExerciseRepState } from '../../types/pose.types';
import { drawSkeletonOverlay } from './SkeletonOverlay';

export type SplitWorkoutScreenProps = {
  exercise: ExercisePrescription;
  repState?: ExerciseRepState;
  paused?: boolean;
  onPause?: () => void;
  onSkip?: () => void;
};

function useSkiaFrameProcessor(
  isAndroid: boolean,
  poseVisible: SharedValue<boolean>,
  hasDetectedPose: SharedValue<boolean>,
): NonNullable<SkiaCameraProps['onFrame']> {
  return useCallback((frame, render) => {
    'worklet';

    try {
      if (isAndroid) {
        nitroPoseExercises.processFrameAndroid(frame);
      } else {
        nitroPoseExercises.processFrameIOS(frame);
      }

      const landmarks = nitroPoseExercises.landmarks;
      if (!hasDetectedPose.value) {
        for (const landmark of landmarks) {
          if (landmark.visibility >= 0.3) {
            hasDetectedPose.value = true;
            poseVisible.value = true;
            break;
          }
        }
      }

      const frameWidth = frame.width;
      const frameHeight = frame.height;
      render(({ canvas, frameTexture }) => {
        'worklet';
        canvas.drawImage(frameTexture, 0, 0);
        if (poseVisible.value) {
          drawSkeletonOverlay(canvas, landmarks, frameWidth, frameHeight);
        }
      });
    } finally {
      frame.dispose();
    }
  }, [hasDetectedPose, isAndroid, poseVisible]);
}

export function SplitWorkoutScreen({
  exercise,
  repState,
  paused = false,
  onPause,
  onSkip,
}: SplitWorkoutScreenProps): React.ReactElement {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [poseEngineReady, setPoseEngineReady] = useState(false);
  const [poseEngineUnavailable, setPoseEngineUnavailable] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const poseVisible = useSharedValue(true);
  const hasDetectedPose = useSharedValue(false);
  const frameProcessor = useSkiaFrameProcessor(
    Platform.OS === 'android',
    poseVisible,
    hasDetectedPose,
  );

  const requestCamera = useCallback(async () => {
    setPermissionRequested(true);
    await requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!hasPermission) return undefined;

    let disposed = false;
    let initialized = false;

    const initializePoseEngine = async () => {
      try {
        await nitroPoseExercises.initialize('');
        initialized = true;
        if (disposed) {
          nitroPoseExercises.release();
          return;
        }

        nitroPoseExercises.onPoseLost = () => {
          poseVisible.value = false;
        };
        nitroPoseExercises.onPoseRegained = () => {
          hasDetectedPose.value = true;
          poseVisible.value = true;
        };
        nitroPoseExercises.startSession(999_999, 0);
        setPoseEngineReady(true);
      } catch {
        if (!disposed) setPoseEngineUnavailable(true);
      }
    };

    void initializePoseEngine();

    return () => {
      disposed = true;
      nitroPoseExercises.onPoseLost = undefined;
      nitroPoseExercises.onPoseRegained = undefined;
      if (initialized) nitroPoseExercises.release();
    };
  }, [hasPermission, hasDetectedPose, poseVisible]);

  const statusText = useMemo(() => {
    if (paused) return 'המשחק מושהה';
    if (repState?.activeErrorCode) return repState.activeErrorCode;
    return exercise.hebrewName;
  }, [exercise.hebrewName, paused, repState?.activeErrorCode]);

  const cameraUnavailableNow = !hasPermission || !device || cameraFailed;

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
        {cameraUnavailableNow ? (
          <Pressable style={styles.noCamera} onPress={hasPermission ? undefined : requestCamera}>
            <Text style={styles.noCameraTitle}>מצלמה אינה זמינה</Text>
            <Text style={styles.noCameraText}>
              {cameraFailed
                ? 'לא הצלחנו להתחבר למצלמה. אפשר לנסות שוב בהמשך.'
                : !hasPermission
                ? permissionRequested
                  ? 'צריך לאשר גישה למצלמה בהגדרות המכשיר'
                  : 'הענק/י גישה למצלמה כדי לזהות מפרקים'
                : 'בדוק/י את מצלמת המכשיר'}
            </Text>
            {!hasPermission ? <Text style={styles.requestText}>הפעלת מצלמה</Text> : null}
          </Pressable>
        ) : poseEngineReady ? (
          <SkiaCamera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={!paused}
            pixelFormat="yuv"
            mirrorMode="auto"
            onFrame={frameProcessor}
            onError={() => setCameraFailed(true)}
          />
        ) : (
          <>
            <Camera style={StyleSheet.absoluteFill} device={device} isActive={!paused} />
            <View style={styles.initializingOverlay}>
              <Text style={styles.poseStatus}>
                {poseEngineUnavailable
                  ? 'לא הצלחנו להפעיל את זיהוי התנועה'
                  : 'מפעילים זיהוי מפרקים...'}
              </Text>
            </View>
          </>
        )}
        {!cameraUnavailableNow && poseEngineReady ? (
          <View pointerEvents="none" style={styles.poseHint}>
            <Text style={styles.poseStatus}>הצג/י את כל הגוף כדי לסמן את המפרקים</Text>
            <Text style={styles.privacyHint}>ניתוח התנועה מתבצע במכשיר בלבד</Text>
          </View>
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
  initializingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  poseHint: {
    position: 'absolute',
    top: 12,
    end: 12,
    alignItems: 'flex-end',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  poseStatus: { color: '#ffffff', fontSize: 13, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  privacyHint: { color: '#C4F278', fontSize: 11, textAlign: 'right', writingDirection: 'rtl' },
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
