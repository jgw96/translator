import type { GtkTextarea } from '../components/gtk-textarea';

/**
 * Handles file upload via the File System Access API.
 * Supports text files, audio files (transcription), and image files (OCR).
 */
export async function handleFileUpload(
  inputTextarea: GtkTextarea
): Promise<void> {
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
  } as OpenFilePickerOptions;

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
    const { transcribeAudio } = await import('../transcribe-service.ts');

    const transcriptionStream = await transcribeAudio(fileData);
    console.log(`Transcription stream:`, transcriptionStream);
    if (transcriptionStream) {
      for await (const chunk of transcriptionStream) {
        console.log(chunk);
        inputTextarea.value += chunk;
      }
    }
  } else if (fileData.type.startsWith('image/')) {
    console.log('Image file selected. Image processing not implemented yet.');
    const { getTextFromImage } = await import('../image-service.ts');
    const textStream = await getTextFromImage(fileData);
    console.log(`Text extraction stream:`, textStream);
    if (textStream) {
      for await (const chunk of textStream) {
        console.log(chunk);
        inputTextarea.value += chunk;
      }
    }
  }
}
