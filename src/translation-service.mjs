let detector = null;

export async function detectLanguage(text) {
    try {
        if (!detector) {
            await initializeDetector();
        }

        const results = await detector.detect(text);

        await detector.destroy();
        detector = null;

        // return the language code with the highest confidence
        const highestConfidence = results.reduce((prev, current) => {
            return (prev.confidence > current.confidence) ? prev : current;
        });

        return highestConfidence.detectedLanguage;
    }
    catch (error) {
        console.error('Error detecting language:', error);
        throw error;
    }
}

async function initializeDetector() {
    detector = await LanguageDetector.create({
        monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
                console.log(`Downloaded ${e.loaded * 100}%`);
            });
        },
    });
}

export async function translateText(text, targetLanguage) {
    try {
        const sourceLanguage = await detectLanguage(text);

        const availability = await Translator.availability({
            sourceLanguage,
            targetLanguage,
        });

        if (availability === "unavailable") {
            throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} is unavailable.`);
        }

        const translator = await Translator.create({
            sourceLanguage,
            targetLanguage,
            monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                    console.log(`Downloaded ${e.loaded * 100}%`);
                });
            },
        });

        const stream = translator.translateStreaming(text);
        console.log('Translation stream created successfully.', stream);
        
        return { stream, translator };
    }
    catch (err) {
        console.error('Error translating text:', err);
        throw err;
    }
}
