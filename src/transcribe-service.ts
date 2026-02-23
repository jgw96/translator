import type { GtkToast } from './components/gtk-toast';

let audioStream: MediaStream | null = null;
let recorder: MediaRecorder | null = null;

let currentBlob: Blob | null = null;

export async function transcribeAudio(
  blob: Blob
): Promise<AsyncIterable<string> | undefined> {
  try {
    const { transcribeAudio: transcribeWithPolyfill } =
      await import('./polyfills/transcription.ts');

    const stream = await transcribeWithPolyfill(blob);
    return stream;
  } catch (error) {
    console.error('Error transcribing audio:', error);

    await import('./components/gtk-toast');

    const toast = document.getElementById('target-toast') as GtkToast | null;
    if (toast) {
      toast.show('Error during transcription. Please try again.', {
        priority: 'high',
        dismissible: true,
      });
    }
    return undefined;
  }
}

export async function recordAudio(): Promise<Blob> {
  try {
    if (!audioStream) {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    const chunks: Blob[] = [];

    if (!recorder) {
      recorder = new MediaRecorder(audioStream);
    }

    return new Promise<Blob>((resolve, reject) => {
      recorder!.ondataavailable = (event: BlobEvent) => {
        chunks.push(event.data);
      };

      recorder!.onstop = () => {
        const audioBlob = new Blob(chunks, { type: recorder!.mimeType });

        // quit the stream
        audioStream!.getTracks().forEach((track) => track.stop());
        audioStream = null;
        recorder = null;

        currentBlob = audioBlob;
        console.log('Recorded audio blob on stop:', audioBlob);

        resolve(audioBlob);
      };

      recorder!.onerror = (event: Event) => {
        reject(event);
      };

      recorder!.start();
    });
  } catch (error) {
    console.error('Error recording audio:', error);

    await import('./components/gtk-toast');

    const toast = document.getElementById('target-toast') as GtkToast | null;
    if (toast) {
      toast.show('Error during recording. Please try again.', {
        priority: 'high',
        dismissible: true,
      });
    }

    throw error;
  }
}

export async function stopRecording(): Promise<void> {
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
  }

  console.log('currentblob:', currentBlob);
}
