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

        const toast = document.getElementById('target-toast');
        if (toast) {
            toast.show('Error detecting language. Please try again.', 
                { 
                    priority: 'high', 
                    dismissible: true 
                }
            );
        }

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
        const toast = document.getElementById('target-toast');
        if (toast) {
            toast.show('Error translating text. You may need to select a target language. Please try again.', 
                { 
                    priority: 'high', 
                    dismissible: true 
                }
            );
        }

        throw err;
    }
}
