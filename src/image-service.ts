export async function getTextFromImage(
  imageBlob: Blob
): Promise<AsyncIterable<string> | undefined> {
  try {
    const session = await LanguageModel.create({
      expectedInputs: [{ type: 'image' }],
    });
    const prompt = 'Extract the text content from the following image:';

    const stream = session.promptStreaming([
      {
        role: 'user',
        content: [
          { type: 'text', value: prompt },
          { type: 'image', value: imageBlob },
        ],
      },
    ]);
    return stream;
  } catch (error) {
    console.error(`Error: ${error}`);
    return undefined;
  }
}
