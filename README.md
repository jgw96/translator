# Translator

A translation Progressive Web App (PWA) that runs entirely on-device. Fast, secure, and works offline.

## Features

- **100% On-Device Processing** - All translation and transcription happens locally on your device. Your data never leaves your machine.
- **Always Fast** - No network latency since everything runs locally.
- **Works Offline** - Once loaded, the app works without an internet connection.
- **Voice Input** - Record audio and have it transcribed automatically.
- **File Upload Support** - Upload text files, audio files, or images to extract and translate text.
- **Image Text Extraction** - Uses on-device AI to extract text from images.
- **Auto Language Detection** - Automatically detects the source language of your text.

## Why I Built This

I started building this app because I wanted to:

1. **Build something small and focused** - A single-purpose app that does one thing well.
2. **Showcase on-device AI on the web** - Demonstrate the power of running AI models directly in the browser.
3. **Build a nice PWA** - Create a polished, installable web app experience.

## Tech Stack

- **[Lit](https://lit.dev/)** - Fast, lightweight web components
- **[Vite](https://vitejs.dev/)** - Next-generation frontend tooling
- **[Native Browser AI APIs](https://developer.chrome.com/docs/ai/built-in)** - Uses the Translator API, Prompt API and LanguageDetector API when available, with polyfills for broader support.

## How It Works

### Translation
The app uses the native [Translator API](https://developer.chrome.com/docs/ai/translator-api) when available in the browser, falling back to the NLLB-200 model via transformers.js for broader compatibility.

### Speech-to-Text
Voice recording uses the [Prompt API][https://developer.chrome.com/docs/ai/prompt-api] when available, with a fallback to the [Transformers.js](https://huggingface.co/Xenova/whisper-small) running the Whisper model.

### Image Text Extraction
Images are processed using the [Prompt API][https://developer.chrome.com/docs/ai/prompt-api] API with multimodal support to extract text content.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/jgw96/translator.git
cd translator

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.
