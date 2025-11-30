/**
 * Transcription Polyfill
 *
 * A unified transcription API that uses the native Prompt API with multimodal support
 * when available, falling back to transformers.js with Whisper.
 *
 * Handles long audio by chunking into 30-second segments with overlap.
 */

let whisperPipeline = null;

// Whisper model constraints
const WHISPER_SAMPLE_RATE = 16000;
const WHISPER_MAX_DURATION = 30; // seconds
const WHISPER_CHUNK_DURATION = 25; // seconds (with 5s overlap for context)
const WHISPER_OVERLAP_DURATION = 5; // seconds

/**
 * Check if native multimodal Prompt API is available for audio
 */
function isNativeTranscriptionAvailable() {
  return (
    typeof LanguageModel !== 'undefined' &&
    typeof LanguageModel.create === 'function'
  );
}

/**
 * Check native API capabilities for audio input
 * Returns true if LanguageModel API exists - actual audio support
 * will be validated when we try to create a session
 */
async function checkNativeAudioSupport() {
  if (!isNativeTranscriptionAvailable()) {
    return false;
  }

  // The LanguageModel API exists, return true and let the actual
  // transcription attempt determine if audio is supported
  // This avoids issues with different ways the API might report capabilities
  return true;
}

/**
 * Load Whisper pipeline (lazy loaded)
 */
async function getWhisperPipeline(progressCallback) {
  if (whisperPipeline) {
    return whisperPipeline;
  }

  const { pipeline } = await import('@huggingface/transformers');

  whisperPipeline = await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-small',
    {
      progress_callback: progressCallback,
    }
  );

  return whisperPipeline;
}

/**
 * Convert audio blob to Float32Array at 16kHz mono
 * This is required for Whisper model input
 */
async function audioToFloat32Array(audioData) {
  // Handle different input types
  let arrayBuffer;

  if (audioData instanceof Blob) {
    arrayBuffer = await audioData.arrayBuffer();
  } else if (audioData instanceof ArrayBuffer) {
    arrayBuffer = audioData;
  } else if (ArrayBuffer.isView(audioData)) {
    arrayBuffer = audioData.buffer;
  } else {
    throw new Error('Unsupported audio data type');
  }

  // Use AudioContext to decode and resample
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: WHISPER_SAMPLE_RATE,
  });

  try {
    const audioBuffer = await audioContext.decodeAudioData(
      arrayBuffer.slice(0)
    );

    // Get audio data as Float32Array
    let audioData32 = audioBuffer.getChannelData(0);

    // If stereo, mix down to mono
    if (audioBuffer.numberOfChannels > 1) {
      const channel1 = audioBuffer.getChannelData(0);
      const channel2 = audioBuffer.getChannelData(1);
      audioData32 = new Float32Array(channel1.length);
      const scalingFactor = Math.sqrt(2);
      for (let i = 0; i < channel1.length; i++) {
        audioData32[i] = (scalingFactor * (channel1[i] + channel2[i])) / 2;
      }
    }

    // Resample to 16kHz if needed
    if (audioBuffer.sampleRate !== WHISPER_SAMPLE_RATE) {
      const resampleRatio = WHISPER_SAMPLE_RATE / audioBuffer.sampleRate;
      const newLength = Math.round(audioData32.length * resampleRatio);
      const resampled = new Float32Array(newLength);

      for (let i = 0; i < newLength; i++) {
        const srcIndex = i / resampleRatio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(
          srcIndexFloor + 1,
          audioData32.length - 1
        );
        const t = srcIndex - srcIndexFloor;
        resampled[i] =
          audioData32[srcIndexFloor] * (1 - t) + audioData32[srcIndexCeil] * t;
      }

      return resampled;
    }

    return audioData32;
  } finally {
    await audioContext.close();
  }
}

/**
 * Split audio into chunks for processing long recordings
 * Uses overlapping chunks to avoid cutting words
 */
function splitAudioIntoChunks(audioFloat32) {
  const chunkSamples = WHISPER_CHUNK_DURATION * WHISPER_SAMPLE_RATE;
  const overlapSamples = WHISPER_OVERLAP_DURATION * WHISPER_SAMPLE_RATE;
  const stepSamples = chunkSamples - overlapSamples;

  const chunks = [];
  let start = 0;

  while (start < audioFloat32.length) {
    const end = Math.min(start + chunkSamples, audioFloat32.length);
    const chunk = audioFloat32.slice(start, end);
    chunks.push({
      audio: chunk,
      startTime: start / WHISPER_SAMPLE_RATE,
      endTime: end / WHISPER_SAMPLE_RATE,
    });

    // Move to next chunk position
    start += stepSamples;

    // If remaining audio is very short, include it in last chunk
    if (audioFloat32.length - start < WHISPER_SAMPLE_RATE * 2) {
      break;
    }
  }

  return chunks;
}

/**
 * Remove duplicate text from overlapping chunks
 * Uses simple word-based deduplication
 */
function mergeChunkTranscriptions(transcriptions) {
  if (transcriptions.length === 0) return '';
  if (transcriptions.length === 1) return transcriptions[0].trim();

  let mergedText = transcriptions[0].trim();

  for (let i = 1; i < transcriptions.length; i++) {
    const currentText = transcriptions[i].trim();
    if (!currentText) continue;

    // Find overlap between end of merged text and start of current text
    const mergedWords = mergedText.split(/\s+/);
    const currentWords = currentText.split(/\s+/);

    // Look for overlapping words (check last N words of merged vs first N of current)
    const maxOverlapWords = Math.min(
      15,
      mergedWords.length,
      currentWords.length
    );
    let bestOverlap = 0;

    for (let overlapLen = 1; overlapLen <= maxOverlapWords; overlapLen++) {
      const mergedEnd = mergedWords.slice(-overlapLen).join(' ').toLowerCase();
      const currentStart = currentWords
        .slice(0, overlapLen)
        .join(' ')
        .toLowerCase();

      if (mergedEnd === currentStart) {
        bestOverlap = overlapLen;
      }
    }

    // Append current text, skipping the overlapping part
    if (bestOverlap > 0) {
      const newWords = currentWords.slice(bestOverlap);
      if (newWords.length > 0) {
        mergedText += ' ' + newWords.join(' ');
      }
    } else {
      mergedText += ' ' + currentText;
    }
  }

  return mergedText;
}

/**
 * Create an async iterable that yields chunks as they're transcribed
 */
function createChunkedStreamingResult(chunksPromise) {
  return {
    [Symbol.asyncIterator]: async function* () {
      const chunks = await chunksPromise;
      let accumulated = '';

      for (const chunk of chunks) {
        accumulated = chunk;
        yield accumulated;
      }
    },

    async text() {
      const chunks = await chunksPromise;
      return chunks[chunks.length - 1] || '';
    },
  };
}

/**
 * Transcribe audio using the native Prompt API
 */
async function transcribeWithNativeAPI(audioData) {
  const arrayBuffer =
    audioData instanceof Blob ? await audioData.arrayBuffer() : audioData;

  const session = await LanguageModel.create({
    expectedInputs: [{ type: 'audio' }],
  });

  const stream = session.promptStreaming([
    {
      role: 'user',
      content: [
        { type: 'text', value: 'transcribe this audio' },
        { type: 'audio', value: arrayBuffer },
      ],
    },
  ]);

  return stream;
}

/**
 * Transcribe audio using Whisper via transformers.js
 * Handles long audio by chunking
 */
async function transcribeWithWhisper(audioData, options = {}) {
  const {
    language,
    task = 'transcribe',
    timestamps = false,
    onProgress,
  } = options;

  const transcriber = await getWhisperPipeline();
  const audioFloat32 = await audioToFloat32Array(audioData);

  const durationSeconds = audioFloat32.length / WHISPER_SAMPLE_RATE;
  console.log(`Audio duration: ${durationSeconds.toFixed(1)} seconds`);

  // Check if we need to chunk the audio
  if (durationSeconds <= WHISPER_MAX_DURATION) {
    // Short audio - process directly
    const transcribeOptions = {
      task,
      return_timestamps: timestamps,
    };

    if (language) {
      transcribeOptions.language = language;
    }

    const result = await transcriber(audioFloat32, transcribeOptions);
    return result.text;
  }

  // Long audio - process in chunks
  console.log('Long audio detected, processing in chunks...');
  const chunks = splitAudioIntoChunks(audioFloat32);
  console.log(`Split into ${chunks.length} chunks`);

  const transcriptions = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    if (onProgress) {
      onProgress({
        chunk: i + 1,
        totalChunks: chunks.length,
        progress: (i / chunks.length) * 100,
      });
    }

    console.log(
      `Processing chunk ${i + 1}/${chunks.length} ` +
        `(${chunk.startTime.toFixed(1)}s - ${chunk.endTime.toFixed(1)}s)`
    );

    const transcribeOptions = {
      task,
      return_timestamps: timestamps,
    };

    if (language) {
      transcribeOptions.language = language;
    }

    const result = await transcriber(chunk.audio, transcribeOptions);
    transcriptions.push(result.text);
  }

  if (onProgress) {
    onProgress({
      chunk: chunks.length,
      totalChunks: chunks.length,
      progress: 100,
    });
  }

  // Merge transcriptions, removing duplicates from overlapping regions
  return mergeChunkTranscriptions(transcriptions);
}

/**
 * Transcribe long audio with streaming progress updates
 */
async function transcribeWithWhisperStreaming(audioData, options = {}) {
  const { language, task = 'transcribe', timestamps = false } = options;

  const transcriber = await getWhisperPipeline();
  const audioFloat32 = await audioToFloat32Array(audioData);

  const durationSeconds = audioFloat32.length / WHISPER_SAMPLE_RATE;

  // Short audio - process directly
  if (durationSeconds <= WHISPER_MAX_DURATION) {
    const transcribeOptions = {
      task,
      return_timestamps: timestamps,
    };

    if (language) {
      transcribeOptions.language = language;
    }

    const result = await transcriber(audioFloat32, transcribeOptions);
    return [result.text];
  }

  // Long audio - process in chunks and yield intermediate results
  const chunks = splitAudioIntoChunks(audioFloat32);
  const transcriptions = [];
  const results = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const transcribeOptions = {
      task,
      return_timestamps: timestamps,
    };

    if (language) {
      transcribeOptions.language = language;
    }

    const result = await transcriber(chunk.audio, transcribeOptions);
    transcriptions.push(result.text);

    // Yield merged result so far
    results.push(mergeChunkTranscriptions(transcriptions));
  }

  return results;
}

/**
 * Polyfilled transcription function that mimics the native API
 * Returns a streaming result for compatibility
 */
export async function transcribeAudio(audioData, options = {}) {
  // Check if native API supports audio
  const hasNativeSupport = await checkNativeAudioSupport();

  if (hasNativeSupport) {
    try {
      return await transcribeWithNativeAPI(audioData);
    } catch (e) {
      console.warn('Native transcription failed, falling back to Whisper:', e);
    }
  }

  // Fall back to Whisper with streaming chunks
  const resultPromise = transcribeWithWhisperStreaming(audioData, options);
  return createChunkedStreamingResult(resultPromise);
}

/**
 * Transcribe audio and return the full text (non-streaming)
 */
export async function transcribeAudioToText(audioData, options = {}) {
  const hasNativeSupport = await checkNativeAudioSupport();

  if (hasNativeSupport) {
    try {
      const stream = await transcribeWithNativeAPI(audioData);
      // Collect all chunks from stream
      let fullText = '';
      for await (const chunk of stream) {
        fullText = chunk; // Native API typically gives full text in last chunk
      }
      return fullText;
    } catch (e) {
      console.warn('Native transcription failed, falling back to Whisper:', e);
    }
  }

  // Fall back to Whisper
  return await transcribeWithWhisper(audioData, options);
}

/**
 * Check availability of transcription
 */
export async function transcriptionAvailability() {
  const hasNativeSupport = await checkNativeAudioSupport();

  if (hasNativeSupport) {
    return 'available';
  }

  // Whisper is always downloadable
  if (whisperPipeline) {
    return 'available';
  }

  return 'downloadable';
}

/**
 * Preload the Whisper model
 */
export async function preloadWhisper(progressCallback) {
  await getWhisperPipeline(progressCallback);
}

/**
 * Get estimated duration of audio in seconds
 */
export async function getAudioDuration(audioData) {
  const audioFloat32 = await audioToFloat32Array(audioData);
  return audioFloat32.length / WHISPER_SAMPLE_RATE;
}

// Export utilities
export {
  isNativeTranscriptionAvailable,
  checkNativeAudioSupport,
  audioToFloat32Array,
  getWhisperPipeline,
  WHISPER_SAMPLE_RATE,
  WHISPER_MAX_DURATION,
};

export default {
  transcribeAudio,
  transcribeAudioToText,
  transcriptionAvailability,
  preloadWhisper,
  getAudioDuration,
  isNativeTranscriptionAvailable,
  checkNativeAudioSupport,
  audioToFloat32Array,
  WHISPER_SAMPLE_RATE,
  WHISPER_MAX_DURATION,
};
