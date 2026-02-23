import type { GtkSelect } from './components/gtk-select';
import type { GtkTextarea } from './components/gtk-textarea';
import type { GtkButton } from './components/gtk-button';
import type { GtkDrawer } from './components/gtk-drawer';
import type { AppRecord } from './components/app-record';

const { enableDisableOutputButtons } = await import('./utils/dom-helpers.ts');

// Lazy-load the languages list and populate the selects
import('./constants/languages.ts').then(({ langs }) => {
  (document.querySelector('gtk-select#source-language') as GtkSelect).items =
    langs;
  (document.querySelector('gtk-select#target-language') as GtkSelect).items =
    langs;
});

enableDisableOutputButtons(true);

const inputTextarea = document.getElementById('input-text') as GtkTextarea;
const outputTextarea = document.getElementById('output-text') as GtkTextarea;
const targetLanguageSelect = document.getElementById(
  'target-language'
) as GtkSelect;
const translateButton = document.getElementById(
  'translate-button'
) as GtkButton;
const sourceLanguageSelect = document.getElementById(
  'source-language'
) as GtkSelect;
const historyButton = document.getElementById('history-button') as GtkButton;

historyButton.addEventListener('click', async () => {
  await import('./components/gtk-drawer');

  const historyDrawer = document.getElementById('history-drawer') as GtkDrawer;
  historyDrawer.show();
});

// Listen for restore-translation events from history component
document.addEventListener('restore-translation', ((
  event: CustomEvent<{
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
  }>
) => {
  const { sourceText, translatedText, sourceLang, targetLang } = event.detail;

  // Set the input and output text
  inputTextarea.value = sourceText;
  outputTextarea.value = translatedText;

  // Set the language selectors
  if (sourceLang) {
    sourceLanguageSelect.value = sourceLang;
  }
  if (targetLang) {
    targetLanguageSelect.value = targetLang;
  }

  // Enable output buttons since we have translated text
  enableDisableOutputButtons(false);

  const historyDrawer = document.getElementById('history-drawer') as GtkDrawer;
  // Close the history drawer
  historyDrawer.close();
}) as EventListener);

// Lazy-load debounce and create debounced input handler
let handleInputChange: (text: string) => void;
let debounceLoadedFlag = false;

inputTextarea.addEventListener('input', (async (
  event: CustomEvent<{ value: string }>
) => {
  if (!debounceLoadedFlag) {
    const { debounce } = await import('./utils/debounce.ts');
    debounceLoadedFlag = true;
    handleInputChange = debounce(async (text: string) => {
      if (!text.trim()) {
        outputTextarea.value = '';

        enableDisableOutputButtons(true);
        return;
      }

      const { detectLanguage } = await import('./translation-service.ts');

      const langCode = await detectLanguage(text);
      console.log(`Detected language code: ${langCode}`);

      sourceLanguageSelect.value = langCode;

      await handleTranslation(text);
    }, 500);
  }

  console.log('Input textarea input:', event);
  const text = event.detail.value;
  handleInputChange?.(text);
}) as unknown as EventListener);

translateButton.addEventListener('click', async () => {
  translateButton.loading = true;

  outputTextarea.value = '';

  try {
    const text =
      inputTextarea.value ||
      'Hello, world! This is a test to see if we can detect the language of this text.';

    await handleTranslation(text);
  } catch (err) {
    console.error('Translation error:', err);
    translateButton.loading = false;
    return;
  }
});

const recordComponent = document.querySelector('app-record') as AppRecord;
const fileUploadButton = document.getElementById('upload-button') as GtkButton;

// Listen for transcription events from the app-record component
recordComponent.addEventListener('transcription-chunk', ((
  event: CustomEvent<{ chunk: string; text: string }>
) => {
  inputTextarea.value = event.detail.text;
}) as EventListener);

recordComponent.addEventListener('transcription-complete', () => {
  enableDisableOutputButtons(false);
});

recordComponent.addEventListener('transcription-error', ((
  event: CustomEvent<{ error: Error }>
) => {
  console.error('Transcription error:', event.detail.error);
}) as EventListener);

async function handleTranslation(text: string): Promise<void> {
  const { handleTranslation: translate } =
    await import('./handlers/translation.ts');
  await translate(text, {
    outputTextarea,
    translateButton,
    sourceLanguageSelect,
    targetLanguageSelect,
    enableDisableOutputButtons,
  });
}

fileUploadButton.addEventListener('click', async () => {
  const { handleFileUpload } = await import('./handlers/file-upload.ts');
  await handleFileUpload(inputTextarea);
  enableDisableOutputButtons(false);
});

const copyButton = document.getElementById('copy-button') as GtkButton;
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputTextarea.value);
    console.log('Output text copied to clipboard.');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
});

const shareButton = document.getElementById('share-button') as GtkButton;
shareButton.addEventListener('click', async () => {
  try {
    await navigator.share({
      title: 'Translated Text',
      text: outputTextarea.value,
    });
    console.log('Output text shared successfully.');
  } catch (err) {
    console.error('Failed to share text: ', err);
  }
});
