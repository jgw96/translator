import { translateText } from './translation-service.mjs';
import {
  recordAudio,
  stopRecording,
  transcribeAudio,
} from './transcribe-service.mjs';

document.querySelector('gtk-select').items = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

enableDisableOutputButtons(true);

const inputTextarea = document.getElementById('input-text');
const outputTextarea = document.getElementById('output-text');
const targetLanguageSelect = document.getElementById('target-language');
const translateButton = document.getElementById('translate-button');

translateButton.addEventListener('click', async () => {
  translateButton.loading = true;

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
  } catch (err) {
    console.error('Translation error:', err);
    translateButton.loading = false;
    return;
  }
});

const recordButton = document.getElementById('record-button');
const stopButton = document.getElementById('stop-button');
// const transcribeButton = document.getElementById('transcribe-button');
const fileUploadButton = document.getElementById('upload-button');

// transcribeButton.disabled = true;

recordButton.addEventListener('click', async () => {
  recordButton.disabled = true;
  recordButton.loading = true;
  stopButton.disabled = false;
  // blob = await recordAudio();
  // console.log('Recorded audio blob:', blob);

  const blob = await recordAudio();
  console.log('Recording ended. Blob:', blob);

  recordButton.loading = false;
  stopButton.loading = true;

  const stream = await transcribeAudio(blob);
  console.log(`Transcription stream:`, stream);

  for await (const chunk of stream) {
    console.log(chunk);
    inputTextarea.value += chunk;
  }

  stopButton.loading = false;

  enableDisableOutputButtons(false);
});

stopButton.addEventListener('click', async () => {
  stopButton.disabled = true;
  recordButton.disabled = false;

  await stopRecording();
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
    const { getTextFromImage } = await import('./image-service.mjs');
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

const clearButton = document.getElementById('clear-button');
clearButton.addEventListener('click', () => {
  outputTextarea.value = '';
  enableDisableOutputButtons(true);
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
