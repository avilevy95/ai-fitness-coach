import { Directory, File, Paths } from 'expo-file-system';
import type { MediaManifest } from '../../types/coach.types';

const CACHE_DIRECTORY_NAME = 'coach-media';

export function getCoachMediaDirectory(): Directory {
  const directory = new Directory(Paths.cache, CACHE_DIRECTORY_NAME);
  if (!directory.exists) {
    directory.create();
  }
  return directory;
}

function safeFileName(value: string, extension: string): string {
  const digest = Array.from(value).reduce(
    (hash, character) => ((hash * 31) ^ character.charCodeAt(0)) >>> 0,
    0,
  );
  return `${digest.toString(16)}${extension}`;
}

export async function cacheRemoteFile(
  url: string,
  fileName?: string,
  extension = '.mp4',
): Promise<string> {
  if (!url) return url;
  if (url.startsWith('file://') || url.startsWith('data:')) return url;

  const destination = new File(
    getCoachMediaDirectory(),
    fileName ?? safeFileName(url, extension),
  );
  if (destination.exists) return destination.uri;

  const downloaded = await File.downloadFileAsync(url, destination, { idempotent: true });
  return downloaded.uri;
}

export const downloadAndCache = cacheRemoteFile;
export const cacheMedia = cacheRemoteFile;

export async function getCachedCoachMedia(
  key: string,
  extension = '.mp4',
): Promise<string | null> {
  const file = new File(getCoachMediaDirectory(), safeFileName(key, extension));
  return file.exists ? file.uri : null;
}

export async function predownloadCoachMedia(
  manifest: MediaManifest,
): Promise<MediaManifest> {
  const warmupUri = manifest.warmupUrl
    ? await cacheRemoteFile(manifest.warmupUrl, 'warmup.mp4', '.mp4')
    : '';

  const exerciseEntries = await Promise.all(
    Object.entries(manifest.exerciseVideos).map(async ([exerciseId, url]) => [
      exerciseId,
      await cacheRemoteFile(url, `exercise-${exerciseId}.mp4`, '.mp4'),
    ] as const),
  );

  const cueEntries = await Promise.all(
    Object.entries(manifest.cueFiles).map(async ([cueId, url]) => [
      cueId,
      await cacheRemoteFile(url, `cue-${safeFileName(cueId, '.mp3')}`, '.mp3'),
    ] as const),
  );
  const cachedAudioCues = await Promise.all(
    manifest.audioCues.map(async (cue) => ({
      ...cue,
      localUri: await cacheRemoteFile(cue.localUri, `audio-${safeFileName(cue.id, '.mp3')}`, '.mp3'),
    })),
  );

  return {
    ...manifest,
    warmupUrl: warmupUri,
    exerciseVideos: Object.fromEntries(exerciseEntries),
    cueFiles: Object.fromEntries(cueEntries),
    audioCues: cachedAudioCues,
  };
}

export const preDownloadCoachMedia = predownloadCoachMedia;
export const predownloadMedia = predownloadCoachMedia;
export const preloadCoachMedia = predownloadCoachMedia;
export const getCachedMedia = getCachedCoachMedia;

export async function clearCoachMediaCache(): Promise<void> {
  const directory = new Directory(Paths.cache, CACHE_DIRECTORY_NAME);
  if (directory.exists) directory.delete();
}
