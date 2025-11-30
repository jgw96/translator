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
              Stop
            </gtk-button>
          `
        : html`
            <gtk-button
              suggested
              id="record-button"
              ?loading=${this._recordLoading}
              @click=${this._handleRecord}
            >
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
