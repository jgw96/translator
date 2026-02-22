import { get, set, clear } from 'idb-keyval';

export interface TranslationEntry {
  timestamp: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export async function storeTranslation(
  sourceText: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  const translationHistory: TranslationEntry[] =
    (await get('translationHistory')) || [];

  const newEntry: TranslationEntry = {
    timestamp: new Date().toISOString(),
    sourceText,
    translatedText,
    sourceLang,
    targetLang,
  };

  translationHistory.push(newEntry);

  await set('translationHistory', translationHistory);
}

export async function getTranslationHistory(): Promise<TranslationEntry[]> {
  const currentHistory = await get<TranslationEntry[]>('translationHistory');
  return currentHistory || [];
}

export async function clearTranslationHistory(): Promise<void> {
  await clear();
}
