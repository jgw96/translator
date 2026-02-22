/**
 * Translation Polyfill
 *
 * A unified translation API that uses the native Translator API when available,
 * falling back to transformers.js with the NLLB-200 model.
 */

import type { TranslationPipeline } from '@huggingface/transformers';

type PipelineFactory = (
  task: string,
  model: string,
  options?: Record<string, unknown>
) => Promise<TranslationPipeline>;

let transformersPipeline: PipelineFactory | null = null;
let transformersTranslator: TranslationPipeline | null = null;

// Map standard language codes to NLLB FLORES-200 codes
const LANG_CODE_TO_NLLB: Record<string, string> = {
  // Common languages (ISO 639-1)
  en: 'eng_Latn',
  es: 'spa_Latn',
  fr: 'fra_Latn',
  de: 'deu_Latn',
  it: 'ita_Latn',
  pt: 'por_Latn',
  nl: 'nld_Latn',
  pl: 'pol_Latn',
  ru: 'rus_Cyrl',
  uk: 'ukr_Cyrl',
  ja: 'jpn_Jpan',
  ko: 'kor_Hang',
  zh: 'zho_Hans',
  'zh-CN': 'zho_Hans',
  'zh-TW': 'zho_Hant',
  ar: 'arb_Arab',
  hi: 'hin_Deva',
  bn: 'ben_Beng',
  tr: 'tur_Latn',
  vi: 'vie_Latn',
  th: 'tha_Thai',
  id: 'ind_Latn',
  ms: 'zsm_Latn',
  tl: 'tgl_Latn',
  sv: 'swe_Latn',
  da: 'dan_Latn',
  no: 'nob_Latn',
  fi: 'fin_Latn',
  el: 'ell_Grek',
  he: 'heb_Hebr',
  cs: 'ces_Latn',
  sk: 'slk_Latn',
  hu: 'hun_Latn',
  ro: 'ron_Latn',
  bg: 'bul_Cyrl',
  hr: 'hrv_Latn',
  sr: 'srp_Cyrl',
  sl: 'slv_Latn',
  et: 'est_Latn',
  lv: 'lvs_Latn',
  lt: 'lit_Latn',
  be: 'bel_Cyrl',
  mk: 'mkd_Cyrl',
  sq: 'als_Latn',
  ca: 'cat_Latn',
  gl: 'glg_Latn',
  eu: 'eus_Latn',
  cy: 'cym_Latn',
  ga: 'gle_Latn',
  mt: 'mlt_Latn',
  is: 'isl_Latn',
  af: 'afr_Latn',
  sw: 'swh_Latn',
  am: 'amh_Ethi',
  ha: 'hau_Latn',
  yo: 'yor_Latn',
  ig: 'ibo_Latn',
  zu: 'zul_Latn',
  xh: 'xho_Latn',
  ta: 'tam_Taml',
  te: 'tel_Telu',
  kn: 'kan_Knda',
  ml: 'mal_Mlym',
  mr: 'mar_Deva',
  gu: 'guj_Gujr',
  pa: 'pan_Guru',
  ur: 'urd_Arab',
  fa: 'pes_Arab',
  ne: 'npi_Deva',
  si: 'sin_Sinh',
  my: 'mya_Mymr',
  km: 'khm_Khmr',
  lo: 'lao_Laoo',
  ka: 'kat_Geor',
  hy: 'hye_Armn',
  az: 'azj_Latn',
  kk: 'kaz_Cyrl',
  uz: 'uzn_Latn',
  ky: 'kir_Cyrl',
  tg: 'tgk_Cyrl',
  mn: 'khk_Cyrl',

  // ISO 639-3 codes (from franc) mapped directly to NLLB
  eng: 'eng_Latn',
  spa: 'spa_Latn',
  fra: 'fra_Latn',
  deu: 'deu_Latn',
  ita: 'ita_Latn',
  por: 'por_Latn',
  nld: 'nld_Latn',
  pol: 'pol_Latn',
  rus: 'rus_Cyrl',
  ukr: 'ukr_Cyrl',
  jpn: 'jpn_Jpan',
  kor: 'kor_Hang',
  zho: 'zho_Hans',
  cmn: 'zho_Hans',
  arb: 'arb_Arab',
  ara: 'arb_Arab',
  hin: 'hin_Deva',
  ben: 'ben_Beng',
  tur: 'tur_Latn',
  vie: 'vie_Latn',
  tha: 'tha_Thai',
  ind: 'ind_Latn',
  msa: 'zsm_Latn',
  zsm: 'zsm_Latn',
  tgl: 'tgl_Latn',
  fil: 'tgl_Latn',
  swe: 'swe_Latn',
  dan: 'dan_Latn',
  nob: 'nob_Latn',
  nno: 'nno_Latn',
  fin: 'fin_Latn',
  ell: 'ell_Grek',
  heb: 'heb_Hebr',
  ces: 'ces_Latn',
  slk: 'slk_Latn',
  hun: 'hun_Latn',
  ron: 'ron_Latn',
  bul: 'bul_Cyrl',
  hrv: 'hrv_Latn',
  srp: 'srp_Cyrl',
  slv: 'slv_Latn',
  est: 'est_Latn',
  lav: 'lvs_Latn',
  lvs: 'lvs_Latn',
  lit: 'lit_Latn',
  bel: 'bel_Cyrl',
  mkd: 'mkd_Cyrl',
  sqi: 'als_Latn',
  als: 'als_Latn',
  cat: 'cat_Latn',
  glg: 'glg_Latn',
  eus: 'eus_Latn',
  cym: 'cym_Latn',
  gle: 'gle_Latn',
  mlt: 'mlt_Latn',
  isl: 'isl_Latn',
  afr: 'afr_Latn',
  swa: 'swh_Latn',
  swh: 'swh_Latn',
  amh: 'amh_Ethi',
  hau: 'hau_Latn',
  yor: 'yor_Latn',
  ibo: 'ibo_Latn',
  zul: 'zul_Latn',
  xho: 'xho_Latn',
  tam: 'tam_Taml',
  tel: 'tel_Telu',
  kan: 'kan_Knda',
  mal: 'mal_Mlym',
  mar: 'mar_Deva',
  guj: 'guj_Gujr',
  pan: 'pan_Guru',
  urd: 'urd_Arab',
  fas: 'pes_Arab',
  pes: 'pes_Arab',
  nep: 'npi_Deva',
  npi: 'npi_Deva',
  sin: 'sin_Sinh',
  mya: 'mya_Mymr',
  khm: 'khm_Khmr',
  lao: 'lao_Laoo',
  kat: 'kat_Geor',
  hye: 'hye_Armn',
  aze: 'azj_Latn',
  azj: 'azj_Latn',
  kaz: 'kaz_Cyrl',
  uzb: 'uzn_Latn',
  uzn: 'uzn_Latn',
  kir: 'kir_Cyrl',
  tgk: 'tgk_Cyrl',
  mon: 'khk_Cyrl',
  khk: 'khk_Cyrl',
  lat: 'lat_Latn',
  ceb: 'ceb_Latn',
  jav: 'jav_Latn',
  sun: 'sun_Latn',
  asm: 'asm_Beng',
  ori: 'ory_Orya',
  ory: 'ory_Orya',
  bod: 'bod_Tibt',
  uig: 'uig_Arab',
  tat: 'tat_Cyrl',
  bos: 'bos_Latn',

  // Scots - map to English as closest supported language
  sco: 'eng_Latn',
  // Other languages that franc might detect but aren't in NLLB - map to closest
  nds: 'deu_Latn', // Low German -> German
  lim: 'nld_Latn', // Limburgish -> Dutch
  fry: 'nld_Latn', // Frisian -> Dutch
  ast: 'spa_Latn', // Asturian -> Spanish (NLLB has ast_Latn but mapping for safety)
  oci: 'fra_Latn', // Occitan -> French (NLLB has oci_Latn)
  cos: 'ita_Latn', // Corsican -> Italian
  ltz: 'deu_Latn', // Luxembourgish -> German (NLLB has ltz_Latn)
  gsw: 'deu_Latn', // Swiss German -> German
  bar: 'deu_Latn', // Bavarian -> German
  pms: 'ita_Latn', // Piedmontese -> Italian
  scn: 'ita_Latn', // Sicilian -> Italian
  vec: 'ita_Latn', // Venetian -> Italian
  nap: 'ita_Latn', // Neapolitan -> Italian
  fur: 'ita_Latn', // Friulian -> Italian
  lmo: 'ita_Latn', // Lombard -> Italian
  egl: 'ita_Latn', // Emilian -> Italian
  wln: 'fra_Latn', // Walloon -> French
  nor: 'nob_Latn', // Norwegian (generic) -> Bokmål
};

// Reverse map for NLLB to standard codes
const NLLB_TO_LANG_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(LANG_CODE_TO_NLLB).map(([k, v]) => [v, k])
);

/**
 * Convert standard language code to NLLB FLORES-200 code
 */
function toNLLBCode(langCode: string): string | null {
  if (!langCode) return null;

  // Already NLLB format (contains underscore)
  if (langCode.includes('_')) {
    return langCode;
  }

  // Try direct match
  if (LANG_CODE_TO_NLLB[langCode]) {
    return LANG_CODE_TO_NLLB[langCode];
  }

  // Try lowercase
  if (LANG_CODE_TO_NLLB[langCode.toLowerCase()]) {
    return LANG_CODE_TO_NLLB[langCode.toLowerCase()];
  }

  // Try just the language part (e.g., "en-US" -> "en")
  const baseLang = langCode.split('-')[0].toLowerCase();
  if (LANG_CODE_TO_NLLB[baseLang]) {
    return LANG_CODE_TO_NLLB[baseLang];
  }

  console.warn(`Unknown language code: ${langCode}, using as-is`);
  return langCode;
}

/**
 * Check if native Translator API is available
 */
function isNativeTranslatorAvailable(): boolean {
  return (
    typeof Translator !== 'undefined' && typeof Translator.create === 'function'
  );
}

/**
 * Load transformers.js pipeline (lazy loaded)
 */
async function getTransformersPipeline(
  progressCallback?: ((progress: Record<string, unknown>) => void) | undefined
): Promise<TranslationPipeline> {
  if (transformersTranslator) {
    return transformersTranslator;
  }

  if (!transformersPipeline) {
    const { pipeline } = await import('@huggingface/transformers');
    transformersPipeline = pipeline as unknown as PipelineFactory;
  }

  transformersTranslator = await transformersPipeline!(
    'translation',
    'Xenova/nllb-200-distilled-600M',
    {
      progress_callback: progressCallback,
    }
  );

  return transformersTranslator;
}

/**
 * Polyfilled Translator class that mimics the native Translator API
 */
class PolyfillTranslator {
  sourceLanguage: string;
  targetLanguage: string;
  private _nativeTranslator: NativeTranslator | null;
  private _useNative: boolean;

  constructor(
    sourceLanguage: string,
    targetLanguage: string,
    nativeTranslator: NativeTranslator | null = null
  ) {
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
    this._nativeTranslator = nativeTranslator;
    this._useNative = !!nativeTranslator;
  }

  /**
   * Check availability of translation for given language pair
   * @returns {'unavailable' | 'downloadable' | 'downloading' | 'available'}
   */
  static async availability(
    options: TranslatorAvailabilityOptions
  ): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'> {
    const { sourceLanguage, targetLanguage } = options;

    // Check native API first
    if (isNativeTranslatorAvailable()) {
      try {
        return await Translator.availability({
          sourceLanguage,
          targetLanguage,
        });
      } catch {
        // Native API failed, check transformers.js availability
      }
    }

    // For transformers.js, we consider it downloadable if we have the language mapping
    const srcCode = toNLLBCode(sourceLanguage);
    const tgtCode = toNLLBCode(targetLanguage);

    if (srcCode && tgtCode) {
      // Check if we already have the model loaded
      if (transformersTranslator) {
        return 'available';
      }
      return 'downloadable';
    }

    return 'unavailable';
  }

  /**
   * Create a new Translator instance
   */
  static async create(
    options: TranslatorCreateOptions
  ): Promise<PolyfillTranslator> {
    const { sourceLanguage, targetLanguage, monitor } = options;

    // Try native API first
    if (isNativeTranslatorAvailable()) {
      try {
        const availability = await Translator.availability({
          sourceLanguage,
          targetLanguage,
        });

        if (availability !== 'unavailable') {
          const nativeTranslator = await Translator.create({
            sourceLanguage,
            targetLanguage,
            monitor,
          });
          return new PolyfillTranslator(
            sourceLanguage,
            targetLanguage,
            nativeTranslator
          );
        }
      } catch (e) {
        console.warn(
          'Native Translator API failed, falling back to transformers.js:',
          e
        );
      }
    }

    // Fall back to transformers.js
    const progressCallback = monitor
      ? (progress: Record<string, unknown>) => {
          if (progress.status === 'progress' && monitor) {
            // Call monitor with a mock object that has addEventListener
            const mockMonitor = {
              addEventListener: (
                type: string,
                callback: (e: { loaded: number }) => void
              ) => {
                if (type === 'downloadprogress') {
                  callback({ loaded: (progress.progress as number) / 100 });
                }
              },
            };
            monitor(mockMonitor as unknown as AIMonitor);
          }
        }
      : undefined;

    await getTransformersPipeline(progressCallback);

    return new PolyfillTranslator(sourceLanguage, targetLanguage);
  }

  /**
   * Translate text (non-streaming)
   */
  async translate(text: string): Promise<string> {
    if (this._useNative && this._nativeTranslator) {
      return await this._nativeTranslator.translate(text);
    }

    // Use transformers.js
    const translator = await getTransformersPipeline();
    const srcLang = toNLLBCode(this.sourceLanguage);
    const tgtLang = toNLLBCode(this.targetLanguage);

    const output = await translator(text, {
      src_lang: srcLang,
      tgt_lang: tgtLang,
    });

    return output[0].translation_text;
  }

  /**
   * Translate text with streaming support
   * Returns an async iterable for compatibility with native API
   */
  translateStreaming(text: string): AsyncIterable<string> {
    if (this._useNative && this._nativeTranslator) {
      return this._nativeTranslator.translateStreaming(text);
    }

    // transformers.js doesn't support true streaming for this model,
    // so we simulate it by returning the full result

    const self = this;

    // Return an object that mimics the native streaming API
    const streamResult: AsyncIterable<string> = {
      [Symbol.asyncIterator]: async function* () {
        const result = await self.translate(text);
        yield result;
      },
    };

    // Add a getter for the final result
    Object.defineProperty(streamResult, 'result', {
      get: async function () {
        return await self.translate(text);
      },
    });

    return streamResult;
  }

  /**
   * Destroy the translator and free resources
   */
  async destroy(): Promise<void> {
    if (this._useNative && this._nativeTranslator) {
      if (typeof this._nativeTranslator.destroy === 'function') {
        await this._nativeTranslator.destroy();
      }
      this._nativeTranslator = null;
    }
    // Note: We don't destroy the transformers.js pipeline as it can be reused
  }
}

// Map ISO 639-3 codes (franc) to ISO 639-1 codes (native API)
const ISO639_3_TO_1: Record<string, string> = {
  eng: 'en',
  spa: 'es',
  fra: 'fr',
  deu: 'de',
  ita: 'it',
  por: 'pt',
  nld: 'nl',
  pol: 'pl',
  rus: 'ru',
  ukr: 'uk',
  jpn: 'ja',
  kor: 'ko',
  zho: 'zh',
  cmn: 'zh',
  arb: 'ar',
  ara: 'ar',
  hin: 'hi',
  ben: 'bn',
  tur: 'tr',
  vie: 'vi',
  tha: 'th',
  ind: 'id',
  msa: 'ms',
  tgl: 'tl',
  swe: 'sv',
  dan: 'da',
  nob: 'no',
  nno: 'no',
  fin: 'fi',
  ell: 'el',
  heb: 'he',
  ces: 'cs',
  slk: 'sk',
  hun: 'hu',
  ron: 'ro',
  bul: 'bg',
  hrv: 'hr',
  srp: 'sr',
  slv: 'sl',
  est: 'et',
  lav: 'lv',
  lit: 'lt',
  bel: 'be',
  mkd: 'mk',
  sqi: 'sq',
  cat: 'ca',
  glg: 'gl',
  eus: 'eu',
  cym: 'cy',
  gle: 'ga',
  mlt: 'mt',
  isl: 'is',
  afr: 'af',
  swa: 'sw',
  swh: 'sw',
  amh: 'am',
  hau: 'ha',
  yor: 'yo',
  ibo: 'ig',
  zul: 'zu',
  xho: 'xh',
  tam: 'ta',
  tel: 'te',
  kan: 'kn',
  mal: 'ml',
  mar: 'mr',
  guj: 'gu',
  pan: 'pa',
  urd: 'ur',
  fas: 'fa',
  pes: 'fa',
  nep: 'ne',
  sin: 'si',
  mya: 'my',
  khm: 'km',
  lao: 'lo',
  kat: 'ka',
  hye: 'hy',
  aze: 'az',
  kaz: 'kk',
  uzb: 'uz',
  kir: 'ky',
  tgk: 'tg',
  mon: 'mn',
  lat: 'la',
  fil: 'tl',
};

/**
 * Convert ISO 639-3 code to ISO 639-1 code
 */
function iso639_3to1(code: string): string | null {
  if (!code || code === 'und') return null;
  return ISO639_3_TO_1[code] || code;
}

/**
 * Check if native LanguageDetector API is available
 */
function isNativeLanguageDetectorAvailable(): boolean {
  return (
    typeof LanguageDetector !== 'undefined' &&
    typeof LanguageDetector.create === 'function'
  );
}

/**
 * Polyfilled LanguageDetector class
 * Uses native API when available, falls back to franc
 */
class PolyfillLanguageDetector {
  private _nativeDetector: NativeLanguageDetector | null;
  private _useNative: boolean;

  constructor(nativeDetector: NativeLanguageDetector | null = null) {
    this._nativeDetector = nativeDetector;
    this._useNative = !!nativeDetector;
  }

  static async create(
    options?: LanguageDetectorCreateOptions
  ): Promise<PolyfillLanguageDetector> {
    // Check if native API is available
    if (isNativeLanguageDetectorAvailable()) {
      try {
        const nativeDetector = await LanguageDetector.create(options);
        return new PolyfillLanguageDetector(nativeDetector);
      } catch {
        // Native API failed, fall through to franc
        console.warn(
          'Native LanguageDetector API failed, falling back to franc'
        );
      }
    }

    // Return polyfill instance that will use franc
    return new PolyfillLanguageDetector();
  }

  /**
   * Detect language of the given text
   * Returns array of {detectedLanguage, confidence} objects
   */
  async detect(
    text: string
  ): Promise<Array<{ detectedLanguage: string; confidence: number }>> {
    if (this._useNative && this._nativeDetector) {
      return await this._nativeDetector.detect(text);
    }

    // Use franc for detection
    const { francAll } = await import('franc');

    const results = francAll(text, { minLength: 3 });

    // Convert franc results to native API format
    // franc returns [[langCode, score], ...] where score is 0-1 (higher is better match)
    return results.slice(0, 5).map(([langCode, score]) => ({
      detectedLanguage: iso639_3to1(langCode) || langCode,
      confidence: score,
    }));
  }

  /**
   * Destroy the detector and free resources
   */
  async destroy(): Promise<void> {
    if (this._useNative && this._nativeDetector) {
      if (typeof this._nativeDetector.destroy === 'function') {
        await this._nativeDetector.destroy();
      }
      this._nativeDetector = null;
    }
    // franc doesn't need cleanup
  }
}

// Export the polyfilled classes
export {
  PolyfillTranslator as Translator,
  PolyfillLanguageDetector as LanguageDetector,
  toNLLBCode,
  iso639_3to1,
  LANG_CODE_TO_NLLB,
  NLLB_TO_LANG_CODE,
  ISO639_3_TO_1,
  isNativeTranslatorAvailable,
  isNativeLanguageDetectorAvailable,
};

// Default export for convenience
export default {
  Translator: PolyfillTranslator,
  LanguageDetector: PolyfillLanguageDetector,
  toNLLBCode,
  iso639_3to1,
  LANG_CODE_TO_NLLB,
  NLLB_TO_LANG_CODE,
  ISO639_3_TO_1,
  isNativeTranslatorAvailable,
  isNativeLanguageDetectorAvailable,
};
