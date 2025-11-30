/**
 * Text-to-Speech Service using Kokoro TTS
 * Uses the kokoro-js library for on-device speech synthesis
 */

/* global Audio */

let ttsInstance = null;
let loadingPromise = null;

/**
 * Get or create the TTS instance (singleton pattern)
 * @param {Function} progressCallback - Optional callback for loading progress
 * @returns {Promise<import('kokoro-js').KokoroTTS>}
 */
export async function getTTSInstance(progressCallback = null) {
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
        progress_callback: progressCallback,
      }
    );

    return ttsInstance;
  })();

  return loadingPromise;
}

/**
 * Generate speech from text
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Generation options
 * @param {string} options.voice - Voice to use (default: 'af_heart')
 * @param {Function} options.onProgress - Progress callback during model loading
 * @returns {Promise<{audio: Float32Array, sampling_rate: number}>}
 */
export async function generateSpeech(text, options = {}) {
  const { voice = 'af_heart', onProgress = null } = options;

  const tts = await getTTSInstance(onProgress);

  const audio = await tts.generate(text, { voice });

  return audio;
}

/**
 * Play generated audio directly
 * @param {string} text - The text to speak
 * @param {Object} options - Generation options
 * @returns {Promise<HTMLAudioElement>} - The audio element being played
 */
export async function speakText(text, options = {}) {
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
 * @returns {Promise<string[]>}
 */
export async function listVoices() {
  const tts = await getTTSInstance();
  return tts.list_voices();
}

/**
 * Default voices categorized by accent and gender
 */
export const VOICES = {
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
