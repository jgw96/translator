import { get, set, clear } from 'idb-keyval';

export async function storeTranslation(
  sourceText,
  translatedText,
  sourceLang,
  targetLang
) {
  const translationHistory = (await get('translationHistory')) || [];

  const newEntry = {
    timestamp: new Date().toISOString(),
    sourceText,
    translatedText,
    sourceLang,
    targetLang,
  };

  translationHistory.push(newEntry);

  await set('translationHistory', translationHistory);
}

export async function getTranslationHistory() {
  const currentHistory = await get('translationHistory');
  return currentHistory || [];
}

export async function clearTranslationHistory() {
  await clear();
}
