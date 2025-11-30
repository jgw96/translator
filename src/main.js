import { translateText, detectLanguage } from './translation-service.js';
import { transcribeAudio } from './transcribe-service.js';

const langs = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'ru', label: 'Russian' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'tr', label: 'Turkish' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'th', label: 'Thai' },
  { value: 'id', label: 'Indonesian' },
  { value: 'ms', label: 'Malay' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'sv', label: 'Swedish' },
  { value: 'da', label: 'Danish' },
  { value: 'no', label: 'Norwegian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'el', label: 'Greek' },
  { value: 'he', label: 'Hebrew' },
  { value: 'cs', label: 'Czech' },
  { value: 'sk', label: 'Slovak' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'ro', label: 'Romanian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'hr', label: 'Croatian' },
  { value: 'sr', label: 'Serbian' },
  { value: 'sl', label: 'Slovenian' },
  { value: 'et', label: 'Estonian' },
  { value: 'lv', label: 'Latvian' },
  { value: 'lt', label: 'Lithuanian' },
  { value: 'ca', label: 'Catalan' },
  { value: 'eu', label: 'Basque' },
  { value: 'gl', label: 'Galician' },
  { value: 'cy', label: 'Welsh' },
  { value: 'ga', label: 'Irish' },
  { value: 'mt', label: 'Maltese' },
  { value: 'is', label: 'Icelandic' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'sw', label: 'Swahili' },
  { value: 'am', label: 'Amharic' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ur', label: 'Urdu' },
  { value: 'fa', label: 'Persian' },
  { value: 'ne', label: 'Nepali' },
  { value: 'si', label: 'Sinhala' },
  { value: 'my', label: 'Burmese' },
  { value: 'km', label: 'Khmer' },
  { value: 'lo', label: 'Lao' },
  { value: 'ka', label: 'Georgian' },
  { value: 'hy', label: 'Armenian' },
  { value: 'az', label: 'Azerbaijani' },
  { value: 'kk', label: 'Kazakh' },
  { value: 'uz', label: 'Uzbek' },
  { value: 'mn', label: 'Mongolian' },
];

document.querySelector('gtk-select#source-language').items = langs;
document.querySelector('gtk-select#target-language').items = langs;

enableDisableOutputButtons(true);

const inputTextarea = document.getElementById('input-text');
const outputTextarea = document.getElementById('output-text');
const targetLanguageSelect = document.getElementById('target-language');
const translateButton = document.getElementById('translate-button');
const sourceLanguageSelect = document.getElementById('source-language');
const historyButton = document.getElementById('history-button');
const historyDrawer = document.getElementById('history-drawer');
console.log('History drawer:', historyDrawer);

historyButton.addEventListener('click', () => {
  historyDrawer.show();
});

inputTextarea.onchange = async (event) => {
  console.log('Input textarea changed:', event);
  const text = event.target.value;

  const langCode = await detectLanguage(text);
  console.log(`Detected language code: ${langCode}`);

  sourceLanguageSelect.value = langCode;
};

translateButton.addEventListener('click', async () => {
  translateButton.loading = true;

  outputTextarea.value = '';

  try {
    const text =
      inputTextarea.value ||
      'Hello, world! This is a test to see if we can detect the language of this text.';

    const translationStream = await translateText(
      text,
      targetLanguageSelect.value
    );
    console.log(`Translation stream:`, translationStream);

    for await (const chunk of translationStream.stream) {
      console.log(chunk);
      outputTextarea.value += chunk;
    }

    translateButton.loading = false;

    translationStream.translator.destroy();

    enableDisableOutputButtons(false);

    const { storeTranslation } = await import('./storage-service.js');

    storeTranslation(
      text,
      outputTextarea.value, // placeholder, will update as we get chunks
      sourceLanguageSelect.value,
      targetLanguageSelect.value
    );
  } catch (err) {
    console.error('Translation error:', err);
    translateButton.loading = false;
    return;
  }
});

const recordComponent = document.querySelector('app-record');
const fileUploadButton = document.getElementById('upload-button');

// Listen for transcription events from the app-record component
recordComponent.addEventListener('transcription-chunk', (event) => {
  inputTextarea.value = event.detail.text;
});

recordComponent.addEventListener('transcription-complete', () => {
  enableDisableOutputButtons(false);
});

recordComponent.addEventListener('transcription-error', (event) => {
  console.error('Transcription error:', event.detail.error);
});

// transcribeButton.addEventListener('click', async () => {
//     transcribeButton.loading = true;

//     const transcriptionStream = await transcribeAudio(blob);
//     console.log(`Transcription stream:`, transcriptionStream);
//     for await (const chunk of transcriptionStream) {
//         console.log(chunk);
//         inputTextarea.value += chunk;
//     }

//     transcribeButton.loading = false;
//     enableDisableOutputButtons(false);
// });

function enableDisableOutputButtons(disabled) {
  console.log(`Setting output buttons disabled=${disabled}`);
  const outputActions = document.getElementById('output-actions');
  console.log('Output actions:', outputActions);
  const buttons = outputActions.querySelectorAll('gtk-button');
  buttons.forEach((button) => {
    button.disabled = disabled;
    console.log(`Disabled button:`, button);
  });
}

fileUploadButton.addEventListener('click', async () => {
  const pickerOpts = {
    types: [
      {
        description: 'Images',
        accept: {
          'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
        },
      },
      {
        description: 'Text Files',
        accept: {
          'text/*': ['.txt', '.md'],
        },
      },
      {
        description: 'Audio Files',
        accept: {
          'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
        },
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
  };

  // Open file picker and destructure the result the first handle
  const [fileHandle] = await window.showOpenFilePicker(pickerOpts);

  // get file contents
  const fileData = await fileHandle.getFile();

  // if a text file, just read and put in input textarea
  if (fileData.type.startsWith('text/')) {
    const text = await fileData.text();
    inputTextarea.value = text;
  } else if (fileData.type.startsWith('audio/')) {
    // otherwise, assume it's an audio file and transcribe
    const transcriptionStream = await transcribeAudio(fileData);
    console.log(`Transcription stream:`, transcriptionStream);
    for await (const chunk of transcriptionStream) {
      console.log(chunk);
      inputTextarea.value += chunk;
    }
  } else if (fileData.type.startsWith('image/')) {
    console.log('Image file selected. Image processing not implemented yet.');
    const { getTextFromImage } = await import('./image-service.js');
    const textStream = await getTextFromImage(fileData);
    console.log(`Text extraction stream:`, textStream);
    for await (const chunk of textStream) {
      console.log(chunk);
      inputTextarea.value += chunk;
    }
  }

  enableDisableOutputButtons(false);
});

const copyButton = document.getElementById('copy-button');
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputTextarea.value);
    console.log('Output text copied to clipboard.');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
});

const shareButton = document.getElementById('share-button');
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
