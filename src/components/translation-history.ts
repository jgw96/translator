import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  getTranslationHistory,
  type TranslationEntry,
} from '../storage-service';

/**
 * Converts a language code to its human-readable name.
 */
export function getLanguageName(code: string, displayLocale = 'en'): string {
  try {
    const displayNames = new Intl.DisplayNames([displayLocale], {
      type: 'language',
    });
    return displayNames.of(code) || code;
  } catch (error) {
    console.warn(
      `Could not get display name for language code: ${code}`,
      error
    );
    return code;
  }
}

@customElement('translation-history')
export class TranslationHistory extends LitElement {
  @property({ attribute: false }) history: TranslationEntry[] = [];

  static styles = css`
    :host {
      display: block;
    }

    h2 {
      margin-top: 0;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      background: transparent;

      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    li {
      padding: 12px 16px;
      transition: background-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);

      background-color: color-mix(in srgb, currentColor 7%, transparent);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
    }

    li:last-child {
      border-bottom: none;
    }

    li:hover {
      background-color: color-mix(in srgb, currentColor 5%, transparent);
    }

    .timestamp {
      font-size: 0.85em;
      color: color-mix(in srgb, currentColor 60%, transparent);
      margin-bottom: 6px;
    }

    .source-text,
    .translated-text {
      margin: 4px 0;
      line-height: 1.4;
    }

    .source-text p,
    .translated-text p {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 100px;
      margin: 4px 0;
    }

    .source-text strong,
    .translated-text strong {
      font-weight: 600;
      color: color-mix(in srgb, currentColor 80%, transparent);
    }

    .languages {
      font-size: 0.85em;
      color: color-mix(in srgb, currentColor 50%, transparent);
      margin-top: 8px;
    }

    p#no {
      color: color-mix(in srgb, currentColor 60%, transparent);
      text-align: center;
      padding: 24px 16px;
    }

    @media (prefers-color-scheme: dark) {
      li:hover {
        background-color: color-mix(in srgb, currentColor 8%, transparent);
      }
    }
  `;

  constructor() {
    super();
    this.loadHistory();
  }

  async loadHistory(): Promise<void> {
    this.history = await getTranslationHistory();
  }

  private _onEntryClick(entry: TranslationEntry): void {
    this.dispatchEvent(
      new CustomEvent('restore-translation', {
        detail: {
          sourceText: entry.sourceText,
          translatedText: entry.translatedText,
          sourceLang: entry.sourceLang,
          targetLang: entry.targetLang,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render(): TemplateResult {
    return html`
      ${this.history.length === 0
        ? html`<p id="no">No translation history available.</p>`
        : html`
            <ul>
              ${this.history.map(
                (entry) => html`
                  <li @click=${() => this._onEntryClick(entry)}>
                    <div class="timestamp">
                      ${new Date(entry.timestamp).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                    <div class="source-text">
                      <strong>Source:</strong>
                      <p>${entry.sourceText}</p>
                    </div>
                    <div class="translated-text">
                      <strong>Translated:</strong>
                      <p>${entry.translatedText}</p>
                    </div>
                    <div class="languages">
                      <em
                        >${getLanguageName(entry.sourceLang)} →
                        ${getLanguageName(entry.targetLang)}</em
                      >
                    </div>
                  </li>
                `
              )}
            </ul>
          `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'translation-history': TranslationHistory;
  }
}
