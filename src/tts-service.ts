/**
 * Text-to-Speech Service using Kokoro TTS
 * Uses the kokoro-js library for on-device speech synthesis
 */

import type { KokoroTTS } from 'kokoro-js';

type ProgressCallback = (progress: Record<string, unknown>) => void;

let ttsInstance: KokoroTTS | null = null;
let loadingPromise: Promise<KokoroTTS> | null = null;

/**
 * Get or create the TTS instance (singleton pattern)
 */
export async function getTTSInstance(
  progressCallback: ProgressCallback | null = null
): Promise<KokoroTTS> {
  if (ttsInstance) {
    return ttsInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const { KokoroTTS } = await import('kokoro-js');

    ttsInstance = await KokoroTTS.from_pretrained(
      'onnx-community/Kokoro-82M-v1.0-ONNX',
      {
        dtype: 'q8', // Good balance of quality and size (92.4 MB)
        progress_callback: progressCallback ?? undefined,
      }
    );

    return ttsInstance;
  })();

  return loadingPromise;
}

interface GenerateSpeechOptions {
  voice?: string;
  onProgress?: ProgressCallback | null;
}

/**
 * Generate speech from text
 */
export async function generateSpeech(
  text: string,
  options: GenerateSpeechOptions = {}
): Promise<{ audio: Float32Array; sampling_rate: number; toBlob: () => Blob }> {
  const { voice = 'af_heart', onProgress = null } = options;

  const tts = await getTTSInstance(onProgress);

  const audio = await tts.generate(text, { voice } as Record<string, unknown>);

  return audio;
}

interface SpeakTextOptions {
  voice?: string;
  onProgress?: ProgressCallback | null;
}

/**
 * Play generated audio directly
 */
export async function speakText(
  text: string,
  options: SpeakTextOptions = {}
): Promise<HTMLAudioElement> {
  const audio = await generateSpeech(text, options);

  // Create audio blob and play it
  const blob = audio.toBlob();
  const url = URL.createObjectURL(blob);

  const audioElement = new Audio(url);
  audioElement.onended = () => {
    URL.revokeObjectURL(url);
  };

  await audioElement.play();
  return audioElement;
}

/**
 * List available voices
 */
export async function listVoices(): Promise<string[]> {
  const tts = await getTTSInstance();
  return tts.list_voices() as unknown as string[];
}

/**
 * Default voices categorized by accent and gender
 */
export const VOICES: Record<string, Record<string, string[]>> = {
  american: {
    female: [
      'af_heart',
      'af_alloy',
      'af_aoede',
      'af_bella',
      'af_jessica',
      'af_kore',
      'af_nicole',
      'af_nova',
      'af_river',
      'af_sarah',
      'af_sky',
    ],
    male: [
      'am_adam',
      'am_echo',
      'am_eric',
      'am_fenrir',
      'am_liam',
      'am_michael',
      'am_onyx',
      'am_puck',
      'am_santa',
    ],
  },
  british: {
    female: ['bf_alice', 'bf_emma', 'bf_isabella', 'bf_lily'],
    male: ['bm_daniel', 'bm_fable', 'bm_george', 'bm_lewis'],
  },
};

export const DEFAULT_VOICE = 'af_heart';
