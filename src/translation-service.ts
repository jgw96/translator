import { Translator, LanguageDetector } from './polyfills/translation';

import type { GtkToast } from './components/gtk-toast';

let detector: InstanceType<typeof LanguageDetector> | null = null;

export async function detectLanguage(text: string): Promise<string> {
  try {
    if (!detector) {
      await initializeDetector();
    }

    const results = await detector!.detect(text);

    await detector!.destroy();
    detector = null;

    // return the language code with the highest confidence
    const highestConfidence = results.reduce((prev, current) => {
      return prev.confidence > current.confidence ? prev : current;
    });

    return highestConfidence.detectedLanguage;
  } catch (error) {
    console.error('Error detecting language:', error);

    const toast = document.getElementById('target-toast') as GtkToast | null;
    if (toast) {
      toast.show('Error detecting language. Please try again.', {
        priority: 'high',
        dismissible: true,
      });
    }

    throw error;
  }
}

async function initializeDetector(): Promise<void> {
  detector = await LanguageDetector.create({
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(
          `Downloaded ${(e as AIDownloadProgressEvent).loaded * 100}%`
        );
      });
    },
  });
}

export interface TranslationResult {
  stream: AsyncIterable<string>;
  translator: { destroy(): Promise<void> | void };
}

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | null = null
): Promise<TranslationResult> {
  try {
    if (!sourceLanguage) {
      sourceLanguage = await detectLanguage(text);
    }

    const availability = await Translator.availability({
      sourceLanguage,
      targetLanguage,
    });

    if (availability === 'unavailable') {
      throw new Error(
        `Translation from ${sourceLanguage} to ${targetLanguage} is unavailable.`
      );
    }

    const translator = await Translator.create({
      sourceLanguage,
      targetLanguage,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(
            `Downloaded ${(e as AIDownloadProgressEvent).loaded * 100}%`
          );
        });
      },
    });

    const stream = translator.translateStreaming(text);
    console.log('Translation stream created successfully.', stream);

    return { stream, translator };
  } catch (err) {
    console.error('Error translating text:', err);
    const toast = document.getElementById('target-toast') as GtkToast | null;
    if (toast) {
      toast.show(
        'Error translating text. You may need to select a target language. Please try again.',
        {
          priority: 'high',
          dismissible: true,
        }
      );
    }

    throw err;
  }
}
