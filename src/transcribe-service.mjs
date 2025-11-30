let audioStream = null;
let recorder = null;

let currentBlob = null;

export async function transcribeAudio(blob) {
    try {
        const arrayBuffer = await blob.arrayBuffer();

        const params = await LanguageModel.params();
        console.log('Language Model params:', params);
        const session = await LanguageModel.create({
            expectedInputs: [{ type: "audio" }]
        });

        const stream = session.promptStreaming([
            {
                role: "user",
                content: [
                    { type: "text", value: "transcribe this audio" },
                    { type: "audio", value: arrayBuffer },
                ],
            },
        ]);
        return stream;
    }
    catch (error) {
        console.error('Error transcribing audio:', error);

        const toast = document.getElementById('target-toast');
        if (toast) {
            toast.show('Error during transcription. Please try again.', 
                { 
                    priority: 'high', 
                    dismissible: true 
                }
            );
        }
    }
}

export async function recordAudio() {
    try {
        if (!audioStream) {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const chunks = [];

        if (!recorder) {
            recorder = new MediaRecorder(audioStream);
        }


        return new Promise((resolve, reject) => {
            recorder.ondataavailable = (event) => {
                chunks.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: recorder.mimeType });

                // quit the stream
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
                recorder = null;

                currentBlob = audioBlob;
                console.log('Recorded audio blob on stop:', audioBlob);

                resolve(audioBlob);
            };

            recorder.onerror = (event) => {
                reject(event.error);
            };

            recorder.start();
        });
    }
    catch (error) {
        console.error('Error recording audio:', error);

        const toast = document.getElementById('target-toast');
        if (toast) {
            toast.show('Error during recording. Please try again.', 
                { 
                    priority: 'high', 
                    dismissible: true 
                }
            );
        }

        throw error;
    }
}

export async function stopRecording() {
    if (recorder && recorder.state === 'recording') {
        await recorder.stop();
    }

    console.log('currentblob:', currentBlob);
}