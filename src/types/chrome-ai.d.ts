/**
 * Type declarations for Chrome's built-in AI APIs
 * These are experimental APIs available in Chrome with appropriate flags enabled.
 */

interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

interface LanguageDetectorCreateOptions {
  monitor?: (monitor: AIMonitor) => void;
}

interface AIMonitor extends EventTarget {
  addEventListener(
    type: 'downloadprogress',
    callback: (event: AIDownloadProgressEvent) => void
  ): void;
}

interface AIDownloadProgressEvent extends Event {
  loaded: number;
  total?: number;
}

interface TranslatorCreateOptions {
  sourceLanguage: string;
  targetLanguage: string;
  monitor?: (monitor: AIMonitor) => void;
}

interface TranslatorAvailabilityOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

interface NativeTranslator {
  translate(text: string): Promise<string>;
  translateStreaming(text: string): AsyncIterable<string>;
  destroy(): Promise<void> | void;
}

interface NativeLanguageDetector {
  detect(text: string): Promise<LanguageDetectionResult[]>;
  destroy(): Promise<void> | void;
}

interface LanguageModelPromptContent {
  type: 'text' | 'image' | 'audio';
  value: string | Blob | ArrayBuffer;
}

interface LanguageModelMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | LanguageModelPromptContent[];
}

interface LanguageModelCreateOptions {
  expectedInputs?: Array<{ type: string }>;
  monitor?: (monitor: AIMonitor) => void;
}

interface NativeLanguageModel {
  prompt(messages: string | LanguageModelMessage[]): Promise<string>;
  promptStreaming(
    messages: string | LanguageModelMessage[]
  ): AsyncIterable<string>;
  destroy(): Promise<void> | void;
}

interface TranslatorConstructor {
  availability(
    options: TranslatorAvailabilityOptions
  ): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
  create(options: TranslatorCreateOptions): Promise<NativeTranslator>;
}

interface LanguageDetectorConstructor {
  availability(): Promise<
    'unavailable' | 'downloadable' | 'downloading' | 'available'
  >;
  create(
    options?: LanguageDetectorCreateOptions
  ): Promise<NativeLanguageDetector>;
}

interface LanguageModelConstructor {
  availability(): Promise<
    'unavailable' | 'downloadable' | 'downloading' | 'available'
  >;
  create(options?: LanguageModelCreateOptions): Promise<NativeLanguageModel>;
}

// Augment the global scope with Chrome AI APIs
declare const Translator: TranslatorConstructor;
declare const LanguageDetector: LanguageDetectorConstructor;
declare const LanguageModel: LanguageModelConstructor;

// File System Access API
interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
}

interface FileSystemFileHandle {
  getFile(): Promise<File>;
  kind: 'file';
  name: string;
}

interface Window {
  showOpenFilePicker(
    options?: OpenFilePickerOptions
  ): Promise<FileSystemFileHandle[]>;
}
