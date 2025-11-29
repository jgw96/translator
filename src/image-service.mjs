export async function getTextFromImage(imageBlob) {
    try {
        const session = await LanguageModel.create({
            expectedInputs: [{ type: "image" }],
        });
        const prompt =
            "Extract the text content from the following image:";

        const stream = session.promptStreaming([
            {
                role: "user",
                content: [
                    { type: "text", value: prompt },
                    { type: "image", value: imageBlob },
                ],
            },
        ]);
        return stream;
    } catch (error) {
        logs.append(`Error: ${error}`);
    }
}