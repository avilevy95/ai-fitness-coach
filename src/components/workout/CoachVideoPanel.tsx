import React, { useEffect, useMemo } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { CoachVideoState, MediaManifest } from '../../types/coach.types';
import type { ExercisePrescription } from '../../types/workout.types';

export type CoachVideoPanelProps = {
  manifest: MediaManifest;
  state?: CoachVideoState;
  exercise?: ExercisePrescription;
  titleHe?: string;
  loop?: boolean;
};

export function CoachVideoPanel({
  manifest,
  state = 'demo',
  exercise,
  titleHe,
  loop = true,
}: CoachVideoPanelProps): React.ReactElement {
  const source = useMemo(() => {
    if (state === 'warmup') return manifest.warmupUrl;
    if (exercise) return manifest.exerciseVideos[exercise.exerciseId] ?? manifest.warmupUrl;
    return manifest.warmupUrl;
  }, [exercise, manifest, state]);

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = state === 'active_loop' || loop;
    instance.muted = false;
  });

  useEffect(() => {
    if (source) player.play();
  }, [player, source]);

  return (
    <View style={styles.panel}>
      {source ? (
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          nativeControls={false}
          contentFit="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {titleHe ?? exercise?.hebrewName ?? 'תרגול'}
          </Text>
        </View>
      )}
      <View style={styles.hud}>
        <Text numberOfLines={1} style={styles.title}>
          {titleHe ?? exercise?.hebrewName ?? ''}
        </Text>
        {exercise ? (
          <Text numberOfLines={2} style={styles.instructions}>
            {exercise.instructionsHe}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    height: '42%',
    backgroundColor: '#101010',
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171717',
  },
  placeholderText: { color: '#ffffff', fontSize: 18 },
  hud: {
    position: 'absolute',
    top: 12,
    end: 12,
    maxWidth: '88%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '700', writingDirection: 'rtl' },
  instructions: { color: '#f1f1f1', fontSize: 13, marginTop: 3, writingDirection: 'rtl' },
});

export default CoachVideoPanel;
