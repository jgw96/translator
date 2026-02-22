import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { speakText, DEFAULT_VOICE } from '../tts-service.ts';

/**
 * A speaker button component for text-to-speech functionality
 * Uses Kokoro TTS for on-device speech synthesis
 */
@customElement('gtk-speaker')
export class GtkSpeaker extends LitElement {
  @property({ type: String }) text = '';
  @property({ type: String }) voice = DEFAULT_VOICE;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @state() loading = false;
  @state() playing = false;

  private _audioElement: HTMLAudioElement | null = null;

  static styles = css`
    :host {
      display: inline-block;
    }

    :host([disabled]) {
      pointer-events: none;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      min-height: 32px;
      min-width: 32px;
      padding: 6px;
      border-radius: 6px;
      border: none;
      cursor: pointer;

      /* GTK4 uses color-mix with currentColor for subtle tinting */
      background-color: color-mix(in srgb, currentColor 10%, transparent);
      color: rgba(0, 0, 0, 0.8);

      /* Smooth transitions */
      transition:
        background-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        opacity 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    button:hover:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 15%, transparent);
    }

    button:active:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 30%, transparent);
    }

    button:focus-visible {
      outline: 2px solid #3584e4;
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Loading state */
    :host([loading]) button {
      cursor: wait;
    }

    /* Playing state - highlight the button */
    :host([playing]) button {
      background-color: color-mix(in srgb, #3584e4 20%, transparent);
      color: #3584e4;
    }

    .icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      button {
        background-color: color-mix(in srgb, currentColor 10%, transparent);
        color: rgba(255, 255, 255, 0.9);
      }

      button:hover:not(:disabled) {
        background-color: color-mix(in srgb, currentColor 15%, transparent);
      }

      button:active:not(:disabled) {
        background-color: color-mix(in srgb, currentColor 25%, transparent);
      }

      button:focus-visible {
        outline-color: #78aeed;
      }

      :host([playing]) button {
        background-color: color-mix(in srgb, #78aeed 20%, transparent);
        color: #78aeed;
      }
    }
  `;

  render(): TemplateResult {
    return html`
      <button
        @click=${this._handleClick}
        ?disabled=${this.disabled || !this.text}
        title=${this.loading
          ? 'Loading speech model...'
          : this.playing
            ? 'Playing...'
            : 'Listen to pronunciation'}
        aria-label=${this.loading
          ? 'Loading speech model'
          : this.playing
            ? 'Playing audio'
            : 'Listen to pronunciation'}
      >
        <span class="icon">
          ${this.loading
            ? html`<span class="spinner"></span>`
            : this.playing
              ? this._renderStopIcon()
              : this._renderSpeakerIcon()}
        </span>
      </button>
    `;
  }

  private _renderSpeakerIcon(): TemplateResult {
    return html`
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
        />
      </svg>
    `;
  }

  private _renderStopIcon(): TemplateResult {
    return html`
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    `;
  }

  private async _handleClick(): Promise<void> {
    // If already playing, stop
    if (this.playing && this._audioElement) {
      this._stopAudio();
      return;
    }

    if (!this.text || this.loading) {
      return;
    }

    this.loading = true;

    try {
      this._audioElement = await speakText(this.text, {
        voice: this.voice,
        onProgress: (progress) => {
          this.dispatchEvent(
            new CustomEvent('tts-progress', {
              detail: progress,
              bubbles: true,
              composed: true,
            })
          );
        },
      });

      this.loading = false;
      this.playing = true;

      this._audioElement.onended = () => {
        this.playing = false;
        this._audioElement = null;
        this.dispatchEvent(
          new CustomEvent('tts-ended', {
            bubbles: true,
            composed: true,
          })
        );
      };

      this._audioElement.onerror = (err) => {
        console.error('Audio playback error:', err);
        this.playing = false;
        this._audioElement = null;
        this.dispatchEvent(
          new CustomEvent('tts-error', {
            detail: { error: err },
            bubbles: true,
            composed: true,
          })
        );
      };

      this.dispatchEvent(
        new CustomEvent('tts-started', {
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      console.error('TTS error:', err);
      this.loading = false;
      this.playing = false;
      this.dispatchEvent(
        new CustomEvent('tts-error', {
          detail: { error: err },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private _stopAudio(): void {
    if (this._audioElement) {
      this._audioElement.pause();
      this._audioElement.currentTime = 0;
      this._audioElement = null;
    }
    this.playing = false;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopAudio();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk-speaker': GtkSpeaker;
  }
}
