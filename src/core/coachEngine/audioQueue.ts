import { Audio } from 'expo-av';
import { Directory, File, Paths } from 'expo-file-system';
import { generateCoachAudio } from '../../services/aiService';

export const CORRECTIVE_CUE_COOLDOWN_MS = 5000;

type CorrectiveCue = {
  id: string;
  textHe: string;
  priority?: number;
};

export class AudioQueue {
  private readonly lastCueAt = new Map<string, number>();
  private isPlaying = false;
  private readonly queue: CorrectiveCue[] = [];
  private sound: Audio.Sound | null = null;
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  canPlayCorrectiveCue(cueId: string): boolean {
    const previous = this.lastCueAt.get(cueId);
    return previous === undefined || this.now() - previous >= CORRECTIVE_CUE_COOLDOWN_MS;
  }

  enqueueCorrectiveCue(cue: CorrectiveCue): boolean {
    if (!this.canPlayCorrectiveCue(cue.id)) return false;
    this.queue.push(cue);
    this.queue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    void this.drain();
    return true;
  }

  queueCorrectiveCue(cue: CorrectiveCue): boolean {
    return this.enqueueCorrectiveCue(cue);
  }

  async enqueueRestTts(textHe: string, voiceId?: string): Promise<void> {
    await this.enqueueAndPlay({ id: `rest:${textHe}`, textHe, priority: 100 }, voiceId);
  }

  async speakRest(textHe: string, voiceId?: string): Promise<void> {
    await this.enqueueRestTts(textHe, voiceId);
  }

  private async drain(): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;
    try {
      while (this.queue.length > 0) {
        const cue = this.queue.shift();
        if (cue) await this.enqueueAndPlay(cue);
      }
    } finally {
      this.isPlaying = false;
    }
  }

  private async enqueueAndPlay(cue: CorrectiveCue, voiceId?: string): Promise<void> {
    if (!this.canPlayCorrectiveCue(cue.id) && cue.priority !== 100) return;

    const result = await generateCoachAudio(cue.textHe, voiceId);
    if (!result.audioBase64) return;

    this.lastCueAt.set(cue.id, this.now());

    const directory = new Directory(Paths.cache, 'coach-audio');
    if (!directory.exists) directory.create();
    const file = new File(directory, `${cue.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.m4a`);
    await file.write(result.audioBase64, { encoding: 'base64' });

    if (this.sound) await this.sound.unloadAsync();
    const created = await Audio.Sound.createAsync(
      { uri: file.uri },
      { shouldPlay: true },
    );
    this.sound = created.sound;
  }

  async clear(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.queue.length = 0;
  }
}

export const audioQueue = new AudioQueue();
