import { LitElement, css, html } from 'lit';
import './gtk-button.js';
import {
  recordAudio,
  stopRecording,
  transcribeAudio,
} from '../transcribe-service.js';

export class AppRecord extends LitElement {
  static properties = {
    recording: { type: Boolean, reflect: true },
    _recordLoading: { type: Boolean, state: true },
    _stopLoading: { type: Boolean, state: true },
  };

  static styles = css`
    :host {
      display: inline-block;
    }
  `;

  constructor() {
    super();
    this.recording = false;
    this._recordLoading = false;
    this._stopLoading = false;
  }

  render() {
    return html`
      ${this.recording
        ? html`
            <gtk-button
              id="stop-button"
              ?loading=${this._stopLoading}
              @click=${this._handleStop}
            >
              <svg
                slot="icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop
            </gtk-button>
          `
        : html`
            <gtk-button
              id="record-button"
              ?loading=${this._recordLoading}
              @click=${this._handleRecord}
            >
              <svg
                slot="icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"
                />
                <path
                  d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
                />
              </svg>
              Record
            </gtk-button>
          `}
    `;
  }

  async _handleRecord() {
    this.recording = true;
    this._recordLoading = true;

    try {
      const blob = await recordAudio();
      console.log('Recording ended. Blob:', blob);

      this._recordLoading = false;
      this._stopLoading = true;

      const stream = await transcribeAudio(blob);
      console.log(`Transcription stream:`, stream);

      let transcribedText = '';
      for await (const chunk of stream) {
        console.log(chunk);
        transcribedText += chunk;
        this.dispatchEvent(
          new CustomEvent('transcription-chunk', {
            detail: { chunk, text: transcribedText },
            bubbles: true,
            composed: true,
          })
        );
      }

      this._stopLoading = false;

      this.dispatchEvent(
        new CustomEvent('transcription-complete', {
          detail: { text: transcribedText },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      console.error('Recording/transcription error:', err);
      this._recordLoading = false;
      this._stopLoading = false;
      this.recording = false;

      this.dispatchEvent(
        new CustomEvent('transcription-error', {
          detail: { error: err },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  async _handleStop() {
    this.recording = false;
    await stopRecording();
  }
}

customElements.define('app-record', AppRecord);
